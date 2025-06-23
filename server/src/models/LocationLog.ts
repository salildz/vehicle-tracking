import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class LocationLog extends Model {
  public id!: number;
  public sessionId!: number;
  public latitude!: number;
  public longitude!: number;
  public speed!: number;
  public heading!: number;
  public accuracy!: number;
  public timestamp!: Date;
  public createdAt!: Date;
}

LocationLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "driving_sessions",
        key: "id",
      },
    },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    speed: { type: DataTypes.FLOAT, defaultValue: 0 },
    heading: { type: DataTypes.FLOAT, defaultValue: 0 },
    accuracy: { type: DataTypes.FLOAT, defaultValue: 0 },
    timestamp: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "LocationLog",
    tableName: "location_logs",
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ["sessionId"],
        name: "idx_location_logs_session_id",
      },
      {
        fields: ["timestamp"],
        name: "idx_location_logs_timestamp",
      },
      {
        fields: ["sessionId", "timestamp"],
        name: "idx_location_logs_session_timestamp",
      },
      // GPS koordinatları için spatial index (PostgreSQL destekler)
      {
        fields: ["latitude", "longitude"],
        name: "idx_location_logs_coordinates",
      },
    ],
  }
);
