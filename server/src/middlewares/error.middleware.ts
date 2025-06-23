import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";

export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Handle known AppErrors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle Sequelize errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: (err as any).errors?.map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
      field: (err as any).errors?.[0]?.path,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      name: err.name,
    }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
