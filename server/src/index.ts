import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomService } from "./services/RoomService.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types/index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://streammate.netlify.app",
  "http://localhost:5173",
];

// Configure CORS for Express
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Incoming request from origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS blocked request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// Configure Socket.IO with more permissive CORS settings
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      console.log("WebSocket connection attempt from:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("WebSocket CORS blocked from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

const roomService = new RoomService();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  console.log("Client origin:", socket.handshake.headers.origin);

  socket.on("joinRoom", async (data, callback) => {
    try {
      let result;

      // Try to join existing room first
      result = roomService.joinRoom(data.roomCode, data.username, socket.id);

      // If room doesn't exist, create a new one
      if (!result) {
        result = roomService.createRoom(data.username, socket.id);
      }

      const { room, user } = result;

      // Store user data in socket
      socket.data = {
        userId: user.id,
        roomCode: room.code,
      };

      // Join socket.io room
      await socket.join(room.code);

      // Notify the user who just joined
      socket.emit("roomJoined", room);

      // Notify other users in the room
      socket.to(room.code).emit("userJoined", user);

      callback();
    } catch (error) {
      console.error("Error joining room:", error);
      callback(error instanceof Error ? error.message : "Failed to join room");
    }
  });

  socket.on("leaveRoom", () => {
    const { userId, roomCode } = socket.data;
    if (!userId || !roomCode) return;

    const { room, user } = roomService.leaveRoom(userId);
    if (room && user) {
      socket.leave(roomCode);
      socket.to(roomCode).emit("userLeft", user.id);
    }

    socket.data = {
      userId: "",
      roomCode: null,
    };
  });

  socket.on("swipe", (data) => {
    const { userId, roomCode } = socket.data;
    if (!userId || !roomCode) return;

    const result = roomService.addSwipe(roomCode, {
      showId: data.showId,
      direction: data.direction,
      userId,
    });

    if (result) {
      const { room, isMatch } = result;

      // Broadcast swipe to all users in the room
      io.to(roomCode).emit("swipeUpdate", {
        showId: data.showId,
        direction: data.direction,
        userId,
        timestamp: new Date(),
      });

      // If it's a match, notify all users
      if (isMatch) {
        io.to(roomCode).emit("matchFound", data.showId);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const { userId, roomCode } = socket.data;
    if (!userId || !roomCode) return;

    const { room, user } = roomService.leaveRoom(userId);
    if (room && user) {
      socket.to(roomCode).emit("userLeft", user.id);
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
