import { Request, Response } from "express";
import { Driver } from "../models/Driver";
import { Vehicle } from "../models/Vehicle";
import { DrivingSession } from "../models/DrivingSession";
import { LocationLog } from "../models/LocationLog";
import { getSocketIO } from "../config/socket";

export class DeviceController {
  // RFID kartı doğrula
  static async validateRfid(req: Request, res: Response) {
    try {
      const { rfidCardId, deviceId } = req.body;

      // Sürücüyü bul
      const driver = await Driver.findOne({
        where: { rfidCardId, isActive: true },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Invalid RFID card or driver not authorized",
        });
      }

      // Araç cihazını bul
      const vehicle = await Vehicle.findOne({
        where: { esp32DeviceId: deviceId, isActive: true },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found or inactive",
        });
      }

      // Aktif oturum var mı kontrol et
      const activeSession = await DrivingSession.findOne({
        where: {
          vehicleId: vehicle.id,
          isActive: true,
        },
      });

      if (activeSession) {
        return res.status(400).json({
          success: false,
          message: "Vehicle is already in use",
        });
      }

      return res.json({
        success: true,
        message: "Driver authorized",
        driver: {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
        },
        vehicle: {
          id: vehicle.id,
          plateNumber: vehicle.plateNumber,
        },
      });
    } catch (error) {
      console.error("RFID validation error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Sürüş oturumunu başlat
  static async startSession(req: Request, res: Response) {
    try {
      const { driverId, vehicleId, location } = req.body;

      const session = await DrivingSession.create({
        driverId,
        vehicleId,
        startTime: new Date(),
        startLocation: location,
        isActive: true,
      });

      // Socket ile real-time bildirim gönder
      const io = getSocketIO();
      io.emit("sessionStarted", {
        sessionId: session.id,
        driverId,
        vehicleId,
        startTime: session.startTime,
      });

      return res.status(201).json({
        success: true,
        sessionId: session.id,
        message: "Driving session started successfully",
      });
    } catch (error) {
      console.error("Start session error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to start session",
      });
    }
  }

  // GPS konumunu kaydet
  static async logLocation(req: Request, res: Response) {
    try {
      const { sessionId, latitude, longitude, speed, heading, accuracy } = req.body;

      // Oturum aktif mi kontrol et
      const session = await DrivingSession.findOne({
        where: { id: sessionId, isActive: true },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Active session not found",
        });
      }

      // Lokasyon kaydını oluştur
      await LocationLog.create({
        sessionId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        accuracy: accuracy || 0,
        timestamp: new Date(),
      });

      // Real-time lokasyon güncellemesi
      const io = getSocketIO();
      io.emit("locationUpdate", {
        sessionId,
        latitude,
        longitude,
        speed,
        timestamp: new Date(),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Location log error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to log location",
      });
    }
  }

  // Sürüş oturumunu sonlandır
  static async endSession(req: Request, res: Response) {
    try {
      const { sessionId, location } = req.body;

      const session = await DrivingSession.findOne({
        where: { id: sessionId, isActive: true },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Active session not found",
        });
      }

      // Toplam mesafeyi hesapla (basit bir hesaplama)
      const locations = await LocationLog.findAll({
        where: { sessionId },
        order: [["timestamp", "ASC"]],
      });

      let totalDistance = 0;
      for (let i = 1; i < locations.length; i++) {
        // Haversine formülü ile mesafe hesaplama
        totalDistance += calculateDistance(locations[i - 1].latitude, locations[i - 1].longitude, locations[i].latitude, locations[i].longitude);
      }

      // Oturumu sonlandır
      await session.update({
        endTime: new Date(),
        endLocation: location,
        totalDistance,
        isActive: false,
      });

      // Socket ile bildirim gönder
      const io = getSocketIO();
      io.emit("sessionEnded", {
        sessionId,
        endTime: new Date(),
        totalDistance,
      });

      return res.json({
        success: true,
        message: "Session ended successfully",
        totalDistance,
      });
    } catch (error) {
      console.error("End session error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to end session",
      });
    }
  }
}

// Haversine formülü - iki GPS koordinatı arasındaki mesafeyi hesaplar
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
