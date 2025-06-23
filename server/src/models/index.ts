import { User } from "./User";
import { Driver } from "./Driver";
import { Vehicle } from "./Vehicle";
import { DrivingSession } from "./DrivingSession";
import { LocationLog } from "./LocationLog";

// İlişkileri burada tanımlayalım
DrivingSession.belongsTo(Driver, { foreignKey: "driverId", as: "driver" });
DrivingSession.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
Driver.hasMany(DrivingSession, { foreignKey: "driverId", as: "sessions" });
Vehicle.hasMany(DrivingSession, { foreignKey: "vehicleId", as: "sessions" });

LocationLog.belongsTo(DrivingSession, { foreignKey: "sessionId", as: "session" });
DrivingSession.hasMany(LocationLog, { foreignKey: "sessionId", as: "locations" });

export { User, Driver, Vehicle, DrivingSession, LocationLog };
