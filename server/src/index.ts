import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import { createServer } from "http";

// Config
import { sequelize } from "./config/database";
import { initializeSocket } from "./config/socket";
import { logger } from "./config/logger";
import { CleanupService } from "./services/cleanupService";

// Models - Import to ensure associations are set up
import "./models";

// Middleware
import { globalErrorHandler } from "./middlewares/error.middleware";
import {
  securityHeaders,
  apiLimiter,
  authLimiter,
  deviceLimiter,
  speedLimiter,
  sanitizeInput,
  requestLogger,
} from "./middlewares/security.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import deviceRoutes from "./routes/device.routes";
import driverRoutes from "./routes/driver.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import analyticsRoutes from "./routes/analytics.routes";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Trust proxy (important for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(securityHeaders);
app.use(compression());
app.use(speedLimiter);

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:9041", "http://127.0.0.1:9041", process.env.CLIENT_URL || "http://localhost:9041"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Health check (no rate limit)
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes with rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/device", deviceLimiter, deviceRoutes);
app.use("/api/drivers", apiLimiter, driverRoutes);
app.use("/api/vehicles", apiLimiter, vehicleRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    code: "ROUTE_NOT_FOUND",
  });
});

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 9040;

// Database connection and server startup
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established successfully");

    await sequelize.sync({
      alter: process.env.NODE_ENV === "development",
      force: false,
    });
    logger.info("Database synchronized");

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`Security headers enabled`);
      logger.info(`Rate limiting active`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);

  httpServer.close(() => {
    logger.info("HTTP server closed");

    sequelize
      .close()
      .then(() => {
        logger.info("Database connection closed");
        process.exit(0);
      })
      .catch((error) => {
        logger.error("Error closing database connection:", error);
        process.exit(1);
      });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Start the server
startServer();

CleanupService.start();
