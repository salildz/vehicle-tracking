import cron from "node-cron";
import { DeviceController } from "../controllers/DeviceController";

export class CleanupService {
  static start() {
    cron.schedule("*/5 * * * *", async () => {
      console.log("🧹 Running session cleanup...");
      try {
        const cleanedCount = await DeviceController.cleanupInactiveSessions();
        if (cleanedCount > 0) {
          console.log(`Session cleanup completed: ${cleanedCount} sessions ended`);
        }
      } catch (error) {
        console.error("Session cleanup error:", error);
      }
    });

    console.log("🚀 Cleanup service started");
  }
}
