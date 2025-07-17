import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class DrivingSession extends Model {
  public id!: number;
  public driverId!: number | null;
  public vehicleId!: number;
  public startTime!: Date;
  public endTime!: Date | null;
  public startLocation!: object;
  public endLocation!: object | null;
  public totalDistance!: number;
  public isActive!: boolean;
  public sessionType!: "authorized" | "unauthorized" | "idle";
  public lastHeartbeat!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  public driver?: any;
  public vehicle?: any;
  public locations?: any[];
}

DrivingSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "drivers",
        key: "id",
      },
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "vehicles",
        key: "id",
      },
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    startLocation: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidLocation(value: any) {
          if (!value || typeof value.latitude !== "number" || typeof value.longitude !== "number") {
            throw new Error("Start location must have valid latitude and longitude");
          }
        },
      },
    },
    endLocation: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    totalDistance: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    sessionType: {
      type: DataTypes.ENUM("authorized", "unauthorized", "idle"),
      allowNull: false,
      defaultValue: "idle",
    },
    lastHeartbeat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "DrivingSession",
    tableName: "driving_sessions",
    timestamps: true,
    indexes: [
      {
        fields: ["driverId"],
        name: "idx_driving_sessions_driver_id",
      },
      {
        fields: ["vehicleId"],
        name: "idx_driving_sessions_vehicle_id",
      },
      {
        fields: ["isActive"],
        name: "idx_driving_sessions_is_active",
      },
      {
        fields: ["startTime"],
        name: "idx_driving_sessions_start_time",
      },
      {
        fields: ["sessionType"],
        name: "idx_driving_sessions_session_type",
      },
      {
        fields: ["lastHeartbeat"],
        name: "idx_driving_sessions_last_heartbeat",
      },
      {
        fields: ["vehicleId", "isActive"],
        name: "idx_driving_sessions_vehicle_active",
      },
      {
        fields: ["driverId", "isActive"],
        name: "idx_driving_sessions_driver_active",
      },
    ],
  }
);
