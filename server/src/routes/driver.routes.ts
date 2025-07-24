import { Router } from "express";
import { DriverController } from "../controllers/DriverController";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.middleware";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

// Get all drivers
router.get("/", DriverController.getAll);

// Add new driver (only admin or operator)
router.post(
  "/",
  requireRole(["admin", "operator"]),
  [
    body("rfidCardId").notEmpty().withMessage("RFID card ID is required"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
  ],
  validate,
  DriverController.create
);

// Update driver
router.put(
  "/:id",
  requireRole(["admin", "operator"]),
  [param("id").isInt().withMessage("Valid driver ID is required")],
  validate,
  DriverController.update
);

// Delete driver
router.delete(
  "/:id",
  requireRole(["admin"]),
  [param("id").isInt().withMessage("Valid driver ID is required")],
  validate,
  DriverController.delete
);

// Driver statistics
router.get(
  "/:id/stats",
  [param("id").isInt().withMessage("Valid driver ID is required")],
  validate,
  DriverController.getStats
);

export default router;
