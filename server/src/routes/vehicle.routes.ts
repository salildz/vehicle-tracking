import { Router } from "express";
import { VehicleController } from "../controllers/VehicleController";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.middleware";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

// Get all vehicles
router.get("/", VehicleController.getAll);

// Get active sessions
router.get("/active-sessions", VehicleController.getActiveSessions);

// Add new vehicle (only admin or operator)
router.post(
  "/",
  requireRole(["admin", "operator"]),
  [
    body("plateNumber").notEmpty().withMessage("Plate number is required"),
    body("brand").notEmpty().withMessage("Brand is required"),
    body("model").notEmpty().withMessage("Model is required"),
    body("year")
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Valid year is required"),
    body("esp32DeviceId").notEmpty().withMessage("ESP32 device ID is required"),
  ],
  validate,
  VehicleController.create
);

// Update vehicle
router.put(
  "/:id",
  requireRole(["admin", "operator"]),
  [param("id").isInt().withMessage("Valid vehicle ID is required")],
  validate,
  VehicleController.update
);

// Delete vehicle
router.delete(
  "/:id",
  requireRole(["admin"]),
  [param("id").isInt().withMessage("Valid vehicle ID is required")],
  validate,
  VehicleController.delete
);

// Vehicle statistics
router.get(
  "/:id/stats",
  [param("id").isInt().withMessage("Valid vehicle ID is required")],
  validate,
  VehicleController.getStats
);

export default router;
