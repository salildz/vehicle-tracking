import { Request, Response } from "express";
import { Driver } from "../models/Driver";
import { DrivingSession } from "../models/DrivingSession";
import { Vehicle } from "../models/Vehicle";
import { LocationLog } from "../models/LocationLog";
import { Op } from "sequelize";

export class DriverController {
  // Tüm sürücüleri listele
  static async getAll(req: Request, res: Response) {
    try {
      const drivers = await Driver.findAll({
        attributes: { exclude: ["createdAt", "updatedAt"] },
        order: [["firstName", "ASC"]],
      });

      return res.json({
        success: true,
        data: drivers,
      });
    } catch (error) {
      console.error("Get drivers error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch drivers",
      });
    }
  }

  // Yeni sürücü ekle
  static async create(req: Request, res: Response) {
    try {
      const { rfidCardId, firstName, lastName, phone, email, licenseNumber, licenseExpiryDate } = req.body;

      const driver = await Driver.create({
        rfidCardId,
        firstName,
        lastName,
        phone,
        email,
        licenseNumber,
        licenseExpiryDate: new Date(licenseExpiryDate),
        isActive: true,
      });

      return res.status(201).json({
        success: true,
        data: driver,
        message: "Driver created successfully",
      });
    } catch (error: any) {
      console.error("Create driver error:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: "RFID card ID or license number already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create driver",
      });
    }
  }

  // Sürücü güncelle
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const driver = await Driver.findByPk(id);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      await driver.update(updateData);

      return res.json({
        success: true,
        data: driver,
        message: "Driver updated successfully",
      });
    } catch (error) {
      console.error("Update driver error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update driver",
      });
    }
  }

  // Sürücü sil (deaktif et)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const driver = await Driver.findByPk(id);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      await driver.update({ isActive: false });

      return res.json({
        success: true,
        message: "Driver deactivated successfully",
      });
    } catch (error) {
      console.error("Delete driver error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete driver",
      });
    }
  }

  // Sürücü istatistikleri
  static async getStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const whereClause: any = { driverId: id };
      if (startDate && endDate) {
        whereClause.startTime = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const sessions = await DrivingSession.findAll({
        where: whereClause,
        include: [
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["plateNumber", "brand", "model"],
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
      console.error("Get driver stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch driver statistics",
      });
    }
  }
}
