const { Server } = require("socket.io");

let io;

const initSocket = (httpServer) => {
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";

  io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("join", (userId) => socket.join(`user:${userId}`));
    socket.on("join-building", (buildingId) => socket.join(`building:${buildingId}`));
    socket.on("disconnect", () => {});
  });

  return io;
};

const getIO = () => { if (!io) throw new Error("Socket not initialized"); return io; };

module.exports = { initSocket, getIO };
