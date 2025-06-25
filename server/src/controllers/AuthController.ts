import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ResponseHelper } from "../utils/response";
import { asyncHandler } from "../middlewares/error.middleware";

// Token generate helper
const generateTokens = (userId: number, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" } // 15 minutes
  );

  const refreshToken = jwt.sign(
    { userId, role, type: "refresh" },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" } // 7 days
  );

  return { accessToken, refreshToken };
};

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

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    await user.update({ refreshToken });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return ResponseHelper.success(
      res,
      {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
      "Login successful"
    );
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ResponseHelper.error(res, "Refresh token is required", 400);
    }

    try {
      // Refresh token'ı verify et
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      if (decoded.type !== "refresh") {
        return ResponseHelper.error(res, "Invalid token type", 401);
      }

      // User'ı kontrol et
      const user = await User.findByPk(decoded.userId);
      if (!user || user.refreshToken !== refreshToken) {
        return ResponseHelper.error(res, "Invalid refresh token", 401);
      }

      // Yeni token'lar generate et
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

      // Yeni refresh token'ı kaydet
      await user.update({ refreshToken: newRefreshToken });

      const { password: _, ...userWithoutPassword } = user.toJSON();

      return ResponseHelper.success(
        res,
        {
          user: userWithoutPassword,
          accessToken,
          refreshToken: newRefreshToken,
        },
        "Token refreshed successfully"
      );
    } catch (error) {
      return ResponseHelper.error(res, "Invalid or expired refresh token", 401);
    }
  });

  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, role = "operator" } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return ResponseHelper.error(res, "All fields are required", 400);
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: ["admin", "operator", "viewer"].includes(role) ? role : "operator",
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    await user.update({ refreshToken });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return ResponseHelper.created(
      res,
      {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      },
      "User created successfully"
    );
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Refresh token'ı database'den temizle
      await User.update({ refreshToken: null }, { where: { refreshToken } });
    }

    return ResponseHelper.success(res, null, "Logged out successfully");
  });
}
