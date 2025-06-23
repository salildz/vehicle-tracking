import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { body } from "express-validator";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

// Login route with validation
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  AuthController.login
);

// Register route with validation
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["admin", "operator", "viewer"]).withMessage("Invalid role"),
  ],
  validate,
  AuthController.register
);

export default router;
