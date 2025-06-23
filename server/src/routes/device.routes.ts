import { Router } from "express";
import { DeviceController } from "../controllers/DeviceController";
import { body } from "express-validator";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

// RFID kartı doğrula
router.post(
  "/validate-rfid",
  [
    body("rfidCardId").notEmpty().withMessage("RFID card ID is required"),
    body("deviceId").notEmpty().withMessage("Device ID is required"),
  ],
  validate,
  DeviceController.validateRfid
);

// Sürüş oturumunu başlat
router.post(
  "/start-session",
  [
    body("driverId").isInt().withMessage("Driver ID must be an integer"),
    body("vehicleId").isInt().withMessage("Vehicle ID must be an integer"),
    body("location").isObject().withMessage("Location must be an object"),
  ],
  validate,
  DeviceController.startSession
);

// GPS konumunu kaydet
router.post(
  "/log-location",
  [
    body("sessionId").isInt().withMessage("Session ID must be an integer"),
    body("latitude").isFloat().withMessage("Latitude must be a valid number"),
    body("longitude").isFloat().withMessage("Longitude must be a valid number"),
  ],
  validate,
  DeviceController.logLocation
);

// Sürüş oturumunu sonlandır
router.post(
  "/end-session",
  [
    body("sessionId").isInt().withMessage("Session ID must be an integer"),
    body("location").isObject().withMessage("Location must be an object"),
  ],
  validate,
  DeviceController.endSession
);

export default router;
