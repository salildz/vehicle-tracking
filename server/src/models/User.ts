import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "operator" | "user";
  refreshToken?: string; // ✅ YENİ FIELD
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: "admin" | "operator" | "user";
  public refreshToken?: string;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "operator", "user"),
      allowNull: false,
      defaultValue: "user",
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);
