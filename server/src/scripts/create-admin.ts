import { sequelize } from "../config/database";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

async function createAdmin() {
  try {
    await sequelize.sync();

    const adminExists = await User.findOne({ where: { email: "admin@admin.com" } });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await User.create({
        email: "admin@admin.com",
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin user created successfully!");
      console.log("Email: admin@admin.com");
      console.log("Password: admin123");
    } else {
      console.log("Admin user already exists");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdmin();
