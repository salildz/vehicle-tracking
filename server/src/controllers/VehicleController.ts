import { Request, Response } from "express";
import { Vehicle } from "../models/Vehicle";
import { DrivingSession } from "../models/DrivingSession";
import { Driver } from "../models/Driver";
import { LocationLog } from "../models/LocationLog";
import { Op } from "sequelize";

export class VehicleController {
  // Tüm araçları listele
  static async getAll(req: Request, res: Response) {
    try {
      const vehicles = await Vehicle.findAll({
        attributes: { exclude: ["createdAt", "updatedAt"] },
        order: [["plateNumber", "ASC"]],
      });

      return res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      console.error("Get vehicles error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch vehicles",
      });
    }
  }

  // Yeni araç ekle
  static async create(req: Request, res: Response) {
    try {
      const { plateNumber, brand, model, year, esp32DeviceId } = req.body;

      const vehicle = await Vehicle.create({
        plateNumber,
        brand,
        model,
        year,
        esp32DeviceId,
        isActive: true,
      });

      return res.status(201).json({
        success: true,
        data: vehicle,
        message: "Vehicle created successfully",
      });
    } catch (error: any) {
      console.error("Create vehicle error:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Plate number or device ID already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create vehicle",
      });
    }
  }

  // Araç güncelle
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vehicle = await Vehicle.findByPk(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      await vehicle.update(updateData);

      return res.json({
        success: true,
        data: vehicle,
        message: "Vehicle updated successfully",
      });
    } catch (error) {
      console.error("Update vehicle error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update vehicle",
      });
    }
  }

  // Araç sil (deaktif et)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findByPk(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      await vehicle.update({ isActive: false });

      return res.json({
        success: true,
        message: "Vehicle deactivated successfully",
      });
    } catch (error) {
      console.error("Delete vehicle error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete vehicle",
      });
    }
  }

  // Araç istatistikleri
  static async getStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const whereClause: any = { vehicleId: id };
      if (startDate && endDate) {
        whereClause.startTime = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const sessions = await DrivingSession.findAll({
        where: whereClause,
        include: [
          {
            model: Driver,
            as: "driver",
            attributes: ["firstName", "lastName"],
          },
        ],
        order: [["startTime", "DESC"]],
      });

      const totalSessions = sessions.length;
      const totalDistance = sessions.reduce((sum, session) => sum + session.totalDistance, 0);
      const totalHours = sessions.reduce((sum, session) => {
        if (session.endTime) {
          const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }
        return sum;
      }, 0);

      return res.json({
        success: true,
        data: {
          totalSessions,
          totalDistance: Math.round(totalDistance * 100) / 100,
          totalHours: Math.round(totalHours * 100) / 100,
          sessions: sessions.slice(0, 10), // Son 10 oturum
        },
      });
    } catch (error) {
      console.error("Get vehicle stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch vehicle statistics",
      });
    }
  }

  // Aktif oturumları getir
  static async getActiveSessions(req: Request, res: Response) {
    try {
      const activeSessions = await DrivingSession.findAll({
        where: { isActive: true },
        include: [
          {
            model: Driver,
            as: "driver",
            attributes: ["firstName", "lastName"],
          },
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["plateNumber", "brand", "model"],
          },
        ],
        order: [["startTime", "DESC"]],
      });

      return res.json({
        success: true,
        data: activeSessions,
      });
    } catch (error) {
      console.error("Get active sessions error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch active sessions",
      });
    }
  }
}
