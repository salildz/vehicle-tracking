import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Driver extends Model {
  public id!: number;
  public rfidCardId!: string;
  public firstName!: string;
  public lastName!: string;
  public phone!: string;
  public email!: string;
  public isActive!: boolean;
  public licenseNumber!: string;
  public licenseExpiryDate!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Driver.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    rfidCardId: { type: DataTypes.STRING, allowNull: false, unique: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    licenseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    licenseExpiryDate: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "Driver",
    tableName: "drivers",
    timestamps: true,
  }
);
