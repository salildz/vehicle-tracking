import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { ResponseHelper } from "../utils/response";
import { asyncHandler } from "../middlewares/error.middleware";

export class AuthController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return ResponseHelper.error(res, "Email and password are required", 400);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return ResponseHelper.error(res, "User not found", 404);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return ResponseHelper.error(res, "Invalid credentials", 401);
    }

    const token = generateToken(user.id, user.role);

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return ResponseHelper.success(
      res,
      {
        user: userWithoutPassword, // User objesini ekle
        token,
      },
      "Login successful"
    );
  });

  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, role = "operator" } = req.body;

    if (!email || !password) {
      return ResponseHelper.error(res, "Email and password are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseHelper.error(res, "Invalid email format", 400);
    }

    if (password.length < 6) {
      return ResponseHelper.error(res, "Password must be at least 6 characters long", 400);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return ResponseHelper.error(res, "User already exists", 400);
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashed,
      role: ["admin", "operator", "viewer"].includes(role) ? role : "operator",
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return ResponseHelper.created(res, userWithoutPassword, "User created successfully");
  });
}
