import { Request, Response } from "express";
import { DrivingSession } from "../models/DrivingSession";
import { Driver } from "../models/Driver";
import { Vehicle } from "../models/Vehicle";
import { LocationLog } from "../models/LocationLog";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config/database";
// ResponseHelper import - bu dosya zaten var
import { ResponseHelper } from "../utils/response";
// NotFoundError import - bu dosya zaten var
import { NotFoundError } from "../utils/errors";
// asyncHandler import - bu dosya zaten var
import { asyncHandler } from "../middlewares/error.middleware";
import { logger } from "../config/logger";

interface DashboardStats {
  summary: {
    totalDrivers: number;
    totalVehicles: number;
    activeSessions: number;
    totalSessions: number;
    totalDistance: number;
    avgDistance: number;
  };
  topDrivers: any[];
  topVehicles: any[];
}

interface DailyStats {
  date: string;
  sessionCount: number;
  totalDistance: number;
  uniqueDrivers: number;
  uniqueVehicles: number;
}

export class AnalyticsController {
  // Enhanced Dashboard Stats with Raw SQL for Performance
  static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    logger.info("Fetching dashboard stats", { startDate, endDate });

    // Build date condition
    let dateCondition = "";
    let replacements: any = {};

    if (startDate && endDate) {
      dateCondition = 'AND "startTime" BETWEEN :startDate AND :endDate';
      replacements = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };
    }

    // Parallel queries for better performance
    const [totalDrivers, totalVehicles, activeSessions, sessionStats, topDrivers, topVehicles] = await Promise.all([
      Driver.count({ where: { isActive: true } }),
      Vehicle.count({ where: { isActive: true } }),
      DrivingSession.count({ where: { isActive: true } }),

      // Session statistics
      sequelize.query(
        `
        SELECT 
          COUNT(*) as "totalSessions",
          COALESCE(SUM("totalDistance"), 0) as "totalDistance",
          COALESCE(AVG("totalDistance"), 0) as "avgDistance"
        FROM "driving_sessions" 
        WHERE "isActive" = false ${dateCondition}
      `,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      ),

      // Top drivers
      sequelize.query(
        `
        SELECT 
          ds."driverId",
          COUNT(ds.id) as "sessionCount",
          COALESCE(SUM(ds."totalDistance"), 0) as "totalDistance",
          d."firstName",
          d."lastName"
        FROM "driving_sessions" ds
        LEFT JOIN "drivers" d ON ds."driverId" = d.id
        WHERE ds."isActive" = false ${dateCondition}
        GROUP BY ds."driverId", d."firstName", d."lastName"
        HAVING COUNT(ds.id) > 0
        ORDER BY "sessionCount" DESC
        LIMIT 5
      `,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      ),

      // Top vehicles
      sequelize.query(
        `
        SELECT 
          ds."vehicleId",
          COUNT(ds.id) as "sessionCount",
          COALESCE(SUM(ds."totalDistance"), 0) as "totalDistance",
          v."plateNumber",
          v."brand",
          v."model"
        FROM "driving_sessions" ds
        LEFT JOIN "vehicles" v ON ds."vehicleId" = v.id
        WHERE ds."isActive" = false ${dateCondition}
        GROUP BY ds."vehicleId", v."plateNumber", v."brand", v."model"
        HAVING COUNT(ds.id) > 0
        ORDER BY "sessionCount" DESC
        LIMIT 5
      `,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      ),
    ]);

    const stats = (sessionStats as any[])[0] || {};

    const dashboardData: DashboardStats = {
      summary: {
        totalDrivers,
        totalVehicles,
        activeSessions,
        totalSessions: parseInt(stats.totalSessions) || 0,
        totalDistance: Math.round((parseFloat(stats.totalDistance) || 0) * 100) / 100,
        avgDistance: Math.round((parseFloat(stats.avgDistance) || 0) * 100) / 100,
      },
      topDrivers: (topDrivers as any[]).map((driver) => ({
        driverId: driver.driverId,
        sessionCount: parseInt(driver.sessionCount),
        totalDistance: Math.round((parseFloat(driver.totalDistance) || 0) * 100) / 100,
        firstName: driver.firstName,
        lastName: driver.lastName,
      })),
      topVehicles: (topVehicles as any[]).map((vehicle) => ({
        vehicleId: vehicle.vehicleId,
        sessionCount: parseInt(vehicle.sessionCount),
        totalDistance: Math.round((parseFloat(vehicle.totalDistance) || 0) * 100) / 100,
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand,
        model: vehicle.model,
      })),
    };

    logger.info("Dashboard stats fetched successfully", {
      totalSessions: dashboardData.summary.totalSessions,
    });

    return ResponseHelper.success(res, dashboardData, "Dashboard statistics retrieved successfully");
  });

  // Enhanced Daily Stats
  static getDailyStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    logger.info("Fetching daily stats", { start, end });

    const dailyStats = await sequelize.query(
      `
      SELECT 
        DATE("startTime") as "date",
        COUNT(*) as "sessionCount",
        COALESCE(SUM("totalDistance"), 0) as "totalDistance",
        COUNT(DISTINCT "driverId") as "uniqueDrivers",
        COUNT(DISTINCT "vehicleId") as "uniqueVehicles"
      FROM "driving_sessions"
      WHERE "startTime" BETWEEN :start AND :end
        AND "isActive" = false
      GROUP BY DATE("startTime")
      ORDER BY DATE("startTime") ASC
    `,
      {
        replacements: { start, end },
        type: QueryTypes.SELECT,
      }
    );

    const formattedStats: DailyStats[] = (dailyStats as any[]).map((stat) => ({
      date: stat.date,
      sessionCount: parseInt(stat.sessionCount),
      totalDistance: Math.round((parseFloat(stat.totalDistance) || 0) * 100) / 100,
      uniqueDrivers: parseInt(stat.uniqueDrivers),
      uniqueVehicles: parseInt(stat.uniqueVehicles),
    }));

    return ResponseHelper.success(res, formattedStats, "Daily statistics retrieved successfully");
  });

  // Enhanced Session History with Proper Pagination
  static getSessionHistory = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, driverId, vehicleId, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = { isActive: false };

    if (driverId) whereClause.driverId = parseInt(driverId as string);
    if (vehicleId) whereClause.vehicleId = parseInt(vehicleId as string);
    if (startDate && endDate) {
      whereClause.startTime = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    logger.info("Fetching session history", { whereClause, page: pageNum, limit: limitNum });

    const sessions = await DrivingSession.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Driver,
          as: "driver",
          attributes: ["firstName", "lastName", "licenseNumber"],
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["plateNumber", "brand", "model"],
        },
      ],
      order: [["startTime", "DESC"]],
      limit: limitNum,
      offset,
      distinct: true,
    });

    return ResponseHelper.paginated(
      res,
      sessions.rows,
      sessions.count,
      pageNum,
      limitNum,
      "Session history retrieved successfully"
    );
  });

  // Enhanced Route Data with GPS Path Optimization - driver/vehicle property düzeltildi
  static getRouteData = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    logger.info("Fetching route data", { sessionId });

    const session = await DrivingSession.findByPk(sessionId, {
      include: [
        {
          model: Driver,
          as: "driver",
          attributes: ["firstName", "lastName", "licenseNumber"],
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["plateNumber", "brand", "model"],
        },
      ],
    });

    if (!session) {
      throw new NotFoundError("Session");
    }

    // Get GPS locations with optimization for large datasets
    const locations = await LocationLog.findAll({
      where: { sessionId },
      order: [["timestamp", "ASC"]],
      attributes: ["latitude", "longitude", "speed", "heading", "accuracy", "timestamp"],
    });

    // Calculate route statistics
    const routeStats = {
      totalPoints: locations.length,
      duration: session.endTime
        ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
        : null,
      maxSpeed: locations.length > 0 ? Math.max(...locations.map((l) => l.speed || 0)) : 0,
      avgSpeed:
        locations.length > 0 ? Math.round(locations.reduce((sum, l) => sum + (l.speed || 0), 0) / locations.length) : 0,
    };

    const routeData = {
      session: {
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        startLocation: session.startLocation,
        endLocation: session.endLocation,
        totalDistance: session.totalDistance,
        isActive: session.isActive,
        // Type assertion - include'lar sayesinde bu propertyler var
        driver: (session as any).driver,
        vehicle: (session as any).vehicle,
      },
      locations,
      stats: routeStats,
    };

    return ResponseHelper.success(res, routeData, "Route data retrieved successfully");
  });
}
