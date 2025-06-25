import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 5 attempts per window
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const deviceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // 60 GPS updates per minute
  message: {
    success: false,
    message: "Too many location updates, please slow down",
    code: "DEVICE_RATE_LIMIT",
  },
  keyGenerator: (req) => {
    const deviceId = req.body?.deviceId || req.ip;
    return `device:${deviceId}`;
  },
});

// Fixed speed limiter - uyarıyı gidermek için
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 500, // Allow 50 requests per window without delay
  delayMs: () => 500, // Fixed: Function instead of number
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false }, // Disable warning
});

// Enhanced helmet configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      Object.keys(obj).forEach((key) => {
        sanitized[key] = sanitize(obj[key]);
      });
      return sanitized;
    }

    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      contentLength: res.get("Content-Length"),
    };

    if (res.statusCode >= 400) {
      console.error("Request error:", logData);
    } else {
      console.log("Request completed:", logData);
    }
  });

  next();
};
