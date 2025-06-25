import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { ResponseHelper } from "../utils/response";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("=== AUTH MIDDLEWARE ===");
    console.log("Authorization header:", authHeader ? "EXISTS" : "MISSING");
    console.log("URL:", req.url);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No valid authorization header");
      return ResponseHelper.error(res, "Access token is required", 401);
    }

    const token = authHeader.substring(7);
    console.log("Extracted token:", token ? "EXISTS" : "MISSING");

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log("Decoded token:", { userId: decoded.userId, role: decoded.role });

    const user = await User.findByPk(decoded.userId); // Bu satır düzeltildi!

    if (!user || !user.isActive) {
      console.log("User validation failed:", {
        userExists: !!user,
        isActive: user?.isActive,
      });
      return ResponseHelper.error(res, "Invalid token", 401);
    }

    req.user = {
      userId: user.id,
      role: user.role,
    };

    console.log("Authentication successful for user:", user.id);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return ResponseHelper.error(res, "Invalid token", 401);
  }
};

// Backwards compatibility
export const authenticate = authenticateToken;

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return ResponseHelper.error(res, "Access denied - insufficient permissions", 403);
    }
    next();
  };
};
