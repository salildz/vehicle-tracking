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

router.post(
  "/refresh",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validate,
  AuthController.refreshToken
);

router.post("/logout", AuthController.logout);

// Register route with validation
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
  ],
  validate,
  AuthController.register
);

export default router;
