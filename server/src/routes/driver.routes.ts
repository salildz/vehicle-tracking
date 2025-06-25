import { Router } from "express";
import { DriverController } from "../controllers/DriverController";
import { body, param } from "express-validator";
import { validate } from "../middlewares/validation.middleware";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Tüm sürücüleri listele
router.get("/", DriverController.getAll);

// Yeni sürücü ekle (sadece admin veya operator)
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

// Sürücü güncelle
router.put(
  "/:id",
  requireRole(["admin", "operator"]),
  [param("id").isInt().withMessage("Valid driver ID is required")],
  validate,
  DriverController.update
);

// Sürücü sil
router.delete(
  "/:id",
  requireRole(["admin"]),
  [param("id").isInt().withMessage("Valid driver ID is required")],
  validate,
  DriverController.delete
);

// Sürücü istatistikleri
router.get(
  "/:id/stats",
  [param("id").isInt().withMessage("Valid driver ID is required")],
  validate,
  DriverController.getStats
);

export default router;
