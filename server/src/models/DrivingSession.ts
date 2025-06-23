import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class DrivingSession extends Model {
  public id!: number;
  public driverId!: number;
  public vehicleId!: number;
  public startTime!: Date;
  public endTime!: Date | null;
  public startLocation!: object;
  public endLocation!: object | null;
  public totalDistance!: number;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Association declarations - bunları ekle
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
      allowNull: false,
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
          if (!value.latitude || !value.longitude) {
            throw new Error("Location must contain latitude and longitude");
          }
          if (typeof value.latitude !== "number" || typeof value.longitude !== "number") {
            throw new Error("Coordinates must be numbers");
          }
          if (value.latitude < -90 || value.latitude > 90) {
            throw new Error("Latitude must be between -90 and 90");
          }
          if (value.longitude < -180 || value.longitude > 180) {
            throw new Error("Longitude must be between -180 and 180");
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
        fields: ["driverId", "isActive"],
        name: "idx_driving_sessions_driver_active",
      },
      {
        fields: ["vehicleId", "isActive"],
        name: "idx_driving_sessions_vehicle_active",
      },
    ],
  }
);
