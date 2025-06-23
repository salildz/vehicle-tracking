import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Vehicle extends Model {
  public id!: number;
  public plateNumber!: string;
  public brand!: string;
  public model!: string;
  public year!: number;
  public esp32DeviceId!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Vehicle.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    plateNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    brand: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    esp32DeviceId: { type: DataTypes.STRING, allowNull: false, unique: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: "Vehicle",
    tableName: "vehicles",
    timestamps: true,
  }
);
