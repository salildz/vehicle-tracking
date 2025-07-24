import { Router } from "express";
import { DeviceController } from "../controllers/DeviceController";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.middleware";
import { deviceLimiter } from "../middlewares/security.middleware";

const router = Router();

// Main endpoint
router.post(
  "/gps-data",
  deviceLimiter, // Rate limiting for device requests
  [
    body("deviceId").notEmpty().withMessage("Device ID is required"),
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required"),
    body("speed").optional().isFloat({ min: 0 }).withMessage("Speed must be a positive number"),
    body("heading").optional().isFloat({ min: 0, max: 360 }).withMessage("Heading must be between 0-360"),
    body("accuracy").optional().isFloat({ min: 0 }).withMessage("Accuracy must be positive"),
    body("rfidCardId").optional().isString().withMessage("RFID card ID must be string"),
    body("timestamp").optional().isISO8601().withMessage("Timestamp must be valid ISO8601 date"),
  ],
  validate,
  DeviceController.receiveGPSData
);

//  Admin endpoints
router.get("/active-sessions", DeviceController.getActiveSessions);

router.post(
  "/force-end-session/:sessionId",
  [
    param("sessionId").isInt().withMessage("Valid session ID is required"),
    body("reason").optional().isString().withMessage("Reason must be string"),
  ],
  validate,
  DeviceController.forceEndSession
);

/*
router.post("/validate-rfid", DeviceController.validateRfid);
router.post("/start-session", DeviceController.startSession);
router.post("/log-location", DeviceController.logLocation);
router.post("/end-session", DeviceController.endSession); */

export default router;
