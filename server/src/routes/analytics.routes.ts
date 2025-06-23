import { Router } from "express";
import { AnalyticsController } from "../controllers/AnalyticsController";
import { authenticateToken } from "../middlewares/auth.middleware";
import { query, param } from "express-validator";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

// Authentication required for all routes
router.use(authenticateToken);

// Dashboard statistics
router.get(
  "/dashboard",
  [query("startDate").optional().isISO8601(), query("endDate").optional().isISO8601()],
  validate,
  AnalyticsController.getDashboardStats
);

// Daily statistics
router.get(
  "/daily",
  [query("startDate").optional().isISO8601(), query("endDate").optional().isISO8601()],
  validate,
  AnalyticsController.getDailyStats
);

// Session history
router.get(
  "/sessions",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("driverId").optional().isInt({ min: 1 }),
    query("vehicleId").optional().isInt({ min: 1 }),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
  ],
  validate,
  AnalyticsController.getSessionHistory
);

// Route data
router.get(
  "/route/:sessionId",
  [param("sessionId").isInt({ min: 1 }).withMessage("Valid session ID required")],
  validate,
  AnalyticsController.getRouteData
);

export default router;
