import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomService } from "./services/RoomService.js";
import { Room, User } from "./types/index.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types/socket.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://streammate.netlify.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://streammate.onrender.com",
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
  },
  transports: ["polling", "websocket"],
  path: "/socket.io/",
});

// Add transport upgrade logging
io.engine.on("upgrade", (transport) => {
  console.log("Transport upgraded to:", transport.name);
});

io.engine.on("upgradeError", (error) => {
  console.error("Transport upgrade error:", error);
});

const roomService = new RoomService();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  console.log("Client origin:", socket.handshake.headers.origin);

  socket.on("createRoom", async (data, callback) => {
    console.log("Attempting to create room:", {
      username: data.username,
      socketId: socket.id,
    });

    if (!data.username?.trim()) {
      console.log("Create room failed: No username provided");
      callback({ error: "Username is required" });
      return;
    }

    try {
      const result = roomService.createRoom(data.username.trim(), socket.id);
      console.log("Room created successfully:", {
        roomCode: result.room.code,
        userId: result.user.id,
      });

      // Store user data in socket
      socket.data = {
        user: result.user,
        roomCode: result.room.code,
      };

      // Join the room
      await socket.join(result.room.code);

      // Notify the user who created the room
      callback({ room: result.room, user: result.user });
    } catch (error) {
      console.error("Error creating room:", error);
      callback({ error: "Failed to create room" });
    }
  });

  socket.on("joinRoom", async (data, callback) => {
    console.log("Join room attempt:", {
      roomCode: data.roomCode,
      username: data.username,
      socketId: socket.id,
    });

    if (!data.username?.trim() || !data.roomCode?.trim()) {
      callback("Username and room code are required");
      return;
    }

    try {
      const result = roomService.joinRoom(
        data.roomCode.trim(),
        data.username.trim(),
        socket.id
      );

      if (!result) {
        callback("Room not found");
        return;
      }

      // Store user data in socket
      socket.data = {
        user: result.user,
        roomCode: result.room.code,
      };

      // Join socket.io room
      await socket.join(result.room.code);

      // Notify the user who just joined
      socket.emit("roomJoined", { room: result.room, user: result.user });

      // Notify other users in the room
      socket.to(result.room.code).emit("userJoined", result.user);

      callback();
    } catch (error) {
      console.error("Error joining room:", error);
      callback(error instanceof Error ? error.message : "Failed to join room");
    }
  });

  socket.on("leaveRoom", () => {
    const { user, roomCode } = socket.data;
    if (user && roomCode) {
      console.log("User leaving room:", {
        userId: user.id,
        roomCode,
        socketId: socket.id,
      });

      // Leave the socket.io room
      socket.leave(roomCode);

      // Remove user from room
      const result = roomService.leaveRoom(user.id);
      if (result.room) {
        // Notify other users
        socket.to(roomCode).emit("userLeft", user.id);
      }

      // Clear socket data
      socket.data = {
        user: null,
        roomCode: null,
      };
    }
  });

  socket.on("swipe", (data) => {
    const { user, roomCode } = socket.data;
    if (user && roomCode) {
      console.log("Swipe received:", {
        userId: user.id,
        roomCode,
        showId: data.showId,
        direction: data.direction,
      });

      const result = roomService.addSwipe(roomCode, {
        userId: user.id,
        showId: data.showId,
        direction: data.direction,
      });

      if (result) {
        // Broadcast swipe to other users in the room
        socket.to(roomCode).emit("swipeUpdate", {
          userId: user.id,
          showId: data.showId,
          direction: data.direction,
        });

        // If it's a match, notify all users
        if (result.isMatch) {
          io.to(roomCode).emit("matchFound", data.showId);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    const { user, roomCode } = socket.data;
    if (user && roomCode) {
      console.log("User disconnected:", {
        userId: user.id,
        roomCode,
        socketId: socket.id,
      });

      // Remove user from room
      const result = roomService.leaveRoom(user.id);
      if (result.room) {
        // Notify other users
        socket.to(roomCode).emit("userLeft", user.id);
      }
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
