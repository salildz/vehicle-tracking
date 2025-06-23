import winston from "winston";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Logs klasörünü oluştur
const logsDir = join(process.cwd(), "logs");
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "vehicle-tracking" },
  transports: [
    new winston.transports.File({
      filename: join(logsDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: join(logsDir, "combined.log"),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}
