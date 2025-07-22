import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:9041",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    // ESP32 cihazları için özel kanal
    socket.on("device-connect", (deviceId) => {
      socket.join(`device-${deviceId}`);
      console.log(`Device ${deviceId} connected`);
    });

    // Admin dashboard için özel kanal
    socket.on("admin-connect", () => {
      socket.join("admin");
      console.log("Admin connected");
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
