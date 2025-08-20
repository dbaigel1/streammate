import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomService } from "./services/RoomService.js";
import { tmdbService } from "./services/TMDBService.js";
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

// Debug environment variables
console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log(
  "TMDB_API_KEY:",
  process.env.TMDB_API_KEY
    ? "***" + process.env.TMDB_API_KEY.slice(-4)
    : "NOT FOUND"
);
console.log("==================================");

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://streammate.netlify.app",
  "https://streammate.com", // Add your custom domain here
  "https://www.streammate.com", // Add www version too
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "https://streammate.onrender.com",
];

// Configure CORS for the Express server
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Express CORS request from:", origin);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log("Allowing request with no origin");
        return callback(null, true);
      }

      // Allow all localhost ports for development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.log("Allowing localhost request:", origin);
        return callback(null, true);
      }

      // Allow specific production origins
      if (allowedOrigins.includes(origin)) {
        console.log("Allowing allowed origin:", origin);
        return callback(null, true);
      }

      console.log("CORS blocked from:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
      console.log("Socket.IO connection attempt from:", origin);
      // Allow requests with no origin
      if (!origin) {
        console.log("Allowing Socket.IO connection with no origin");
        return callback(null, true);
      }

      // Allow all localhost ports for development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.log("Allowing Socket.IO localhost connection:", origin);
        return callback(null, true);
      }

      // Allow specific production origins
      if (allowedOrigins.includes(origin)) {
        console.log("Allowing Socket.IO allowed origin:", origin);
        return callback(null, true);
      }

      console.log("Socket.IO CORS blocked from:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling"], // Use only polling to avoid upgrade issues
  path: "/socket.io/",
  allowEIO3: false, // Disable Engine.IO v3 compatibility
  pingTimeout: 60000, // Increase ping timeout to 60 seconds
  pingInterval: 25000, // Increase ping interval to 25 seconds
});

// Add connection logging
io.engine.on("connection", (socket) => {
  console.log("=== NEW SOCKET.IO CONNECTION ===");
  console.log("Socket ID:", socket.id);
  console.log("Transport:", socket.transport.name);
  console.log("Origin:", socket.handshake?.headers?.origin || "unknown");
});

io.engine.on("connection_error", (error) => {
  console.error("=== SOCKET.IO CONNECTION ERROR ===", error);
});

const roomService = new RoomService();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  console.log("Client origin:", socket.handshake?.headers?.origin || "unknown");

  socket.on("createRoom", async (data, callback) => {
    console.log("=== CREATE ROOM EVENT RECEIVED ===");
    console.log("Socket ID:", socket.id);
    console.log("Data received:", data);
    console.log("Callback function:", typeof callback);

    if (!data.username?.trim()) {
      console.log("Create room failed: No username provided");
      callback({ error: "Username is required" });
      return;
    }

    if (!data.contentType || !["movies", "tv"].includes(data.contentType)) {
      console.log("Create room failed: Invalid content type");
      callback({ error: "Content type must be 'movies' or 'tv'" });
      return;
    }

    try {
      console.log("Calling roomService.createRoom...");
      const result = roomService.createRoom(
        data.username.trim(),
        socket.id,
        data.contentType as "movies" | "tv"
      );
      console.log("Room created successfully:", {
        roomCode: result.room.code,
        userId: result.user.id,
        contentType: data.contentType,
      });

      // Store user data in socket
      socket.data = {
        user: result.user,
        roomCode: result.room.code,
      };

      // Join the room
      await socket.join(result.room.code);
      console.log("Room creator joined socket.io room:", {
        username: result.user.username,
        userId: result.user.id,
        socketId: socket.id,
        roomCode: result.room.code,
      });

      // Send contentType update to ensure UI consistency
      socket.emit("roomContentTypeUpdate", {
        contentType: result.room.contentType,
        roomCode: result.room.code,
      });

      // Notify the user who created the room
      console.log("About to call callback with success response...");
      callback({ room: result.room, user: result.user });
      console.log("Callback called successfully");
    } catch (error) {
      console.error("Error creating room:", error);
      callback({ error: "Failed to create room" });
    }
  });

  socket.on("joinRoom", async (data, callback) => {
    console.log("Attempting to join room:", {
      username: data.username,
      roomCode: data.roomCode,
      contentType: data.contentType,
      socketId: socket.id,
    });

    if (!data.username?.trim()) {
      callback("Username is required");
      return;
    }

    if (!data.roomCode?.trim()) {
      callback("Room code is required");
      return;
    }

    if (!data.contentType || !["movies", "tv"].includes(data.contentType)) {
      callback("Content type must be 'movies' or 'tv'");
      return;
    }

    try {
      const result = roomService.joinRoom(
        data.roomCode.trim().toUpperCase(),
        data.username.trim(),
        socket.id
      );
      if (!result || !result.room) {
        callback("Room not found or failed to join");
        return;
      }

      // Store user data in socket
      socket.data = {
        user: result.user,
        roomCode: result.room.code,
      };

      // Join the room
      await socket.join(result.room.code);
      console.log("User joined socket.io room:", {
        username: result.user.username,
        userId: result.user.id,
        socketId: socket.id,
        roomCode: result.room.code,
      });

      // Send current room state to the joining user
      console.log("Sending roomStateUpdate to joining user:", {
        users: result.room.users.map((u) => ({
          id: u.id,
          username: u.username,
        })),
        roomCode: result.room.code,
        contentType: result.room.contentType,
      });
      socket.emit("roomStateUpdate", {
        users: result.room.users,
        roomCode: result.room.code,
        contentType: result.room.contentType,
      });

      // Also send the room's contentType specifically to ensure UI consistency
      socket.emit("roomContentTypeUpdate", {
        contentType: result.room.contentType,
        roomCode: result.room.code,
      });

      // Notify other users in the room about the new user
      socket.to(result.room.code).emit("userJoined", result.user);

      // Also notify other users about the updated room state
      console.log("Sending roomStateUpdate to other users in room:", {
        users: result.room.users.map((u) => ({
          id: u.id,
          username: u.username,
        })),
        roomCode: result.room.code,
        contentType: result.room.contentType,
      });
      socket.to(result.room.code).emit("roomStateUpdate", {
        users: result.room.users,
        roomCode: result.room.code,
        contentType: result.room.contentType,
      });

      callback(undefined); // Success - this is the correct type
    } catch (error) {
      console.error("Error joining room:", error);
      callback("Failed to join room");
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
        // Notify other users about the user leaving
        socket.to(roomCode).emit("userLeft", user.id);

        // Also notify other users about the updated room state
        console.log("Sending roomStateUpdate after user left:", {
          users: result.room.users.map((u) => ({
            id: u.id,
            username: u.username,
          })),
          roomCode: result.room.code,
          contentType: result.room.contentType,
        });
        socket.to(roomCode).emit("roomStateUpdate", {
          users: result.room.users,
          roomCode: result.room.code,
          contentType: result.room.contentType,
        });
      }

      // Clear socket data
      socket.data = {
        user: null,
        roomCode: null,
      };
    }
  });

  socket.on("swipe", async (data) => {
    const { user, roomCode } = socket.data;
    if (user && roomCode) {
      console.log("Server: Swipe received:", {
        userId: user.id,
        username: user.username,
        roomCode,
        showId: data.showId,
        showIdType: typeof data.showId,
        direction: data.direction,
      });

      try {
        const result = roomService.addSwipe(roomCode, {
          userId: user.id,
          showId: data.showId,
          direction: data.direction,
          timestamp: new Date(),
        });

        // Broadcast swipe to other users in the room
        socket.to(roomCode).emit("swipeUpdate", {
          userId: user.id,
          showId: data.showId,
          direction: data.direction,
        });

        // If it's a match, notify all users in the room
        if (result.isMatch && result.matchedUsers) {
          // Get current room state for logging
          const currentRoom = roomService.getRoom(roomCode);

          // Ensure showId is normalized as string
          const normalizedShowId = String(data.showId);

          console.log("Server: Match found!", {
            showId: normalizedShowId,
            showIdType: typeof normalizedShowId,
            matchedUsers: result.matchedUsers,
            matchedUsernames: result.matchedUsers.map(
              (userId) =>
                currentRoom?.users.find((u: any) => u.id === userId)?.username
            ),
          });

          console.log(
            "Server: About to emit matchFound event with showId:",
            normalizedShowId
          );

          // Get all users in the room for logging
          const roomUsers = currentRoom?.users || [];
          console.log(
            "Server: About to emit matchFound to all users in room:",
            {
              roomCode,
              totalUsers: roomUsers.length,
              users: roomUsers.map((u: any) => ({
                id: u.id,
                username: u.username,
                socketId: u.socketId,
              })),
              matchedUsers: result.matchedUsers,
              matchedUsernames: result.matchedUsers.map(
                (userId) =>
                  roomUsers.find((u: any) => u.id === userId)?.username
              ),
            }
          );

          // Get all users in the room for logging
          const roomSockets = await io.in(roomCode).fetchSockets();
          console.log("Server: Socket.io room details:", {
            roomCode,
            totalSocketsInRoom: roomSockets.length,
            socketIds: roomSockets.map((s) => s.id),
            usersInRoom: roomUsers.map((u: any) => ({
              id: u.id,
              username: u.username,
              socketId: u.socketId,
              isInSocketRoom: roomSockets.some((s) => s.id === u.socketId),
            })),
          });

          // Small delay to ensure all users are properly in the room
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Get current room state for verification
          const matchRoom = roomService.getRoom(roomCode);
          const matchRoomUsers = matchRoom?.users || [];

          console.log("Server: About to emit matchFound event:", {
            roomCode,
            totalUsersInRoom: matchRoomUsers.length,
            users: matchRoomUsers.map((u: any) => ({
              id: u.id,
              username: u.username,
              socketId: u.socketId,
            })),
            matchedUsers: result.matchedUsers || [],
            matchedUsernames: (result.matchedUsers || []).map(
              (userId) =>
                matchRoomUsers.find((u: any) => u.id === userId)?.username
            ),
          });

          // Emit match event to all users in the room using the most reliable method
          io.to(roomCode).emit("matchFound", {
            showId: normalizedShowId,
            matchedUsers: result.matchedUsers || [],
          });

          // Also emit to individual sockets as a backup to ensure delivery
          for (const socket of roomSockets) {
            socket.emit("matchFound", {
              showId: normalizedShowId,
              matchedUsers: result.matchedUsers || [],
            });
          }

          console.log(
            "Server: Emitted matchFound event successfully to room:",
            roomCode,
            "using both room broadcast and individual socket emission"
          );
        }
      } catch (error) {
        console.error("Server: Error processing swipe:", error);
        socket.emit("error", "Failed to process swipe");
      }
    }
  });

  // New event handler for getting streaming content
  socket.on("getStreamingContent", async (data, callback) => {
    try {
      console.log(
        "Client requested streaming content",
        data?.platform ? `(platform: ${data.platform})` : "(no platform)",
        data?.contentType
          ? `(contentType: ${data.contentType})`
          : "(no contentType)"
      );
      const shows = await tmdbService.getStreamingContent(
        (data?.platform as "netflix" | "hulu") || "netflix",
        (data?.contentType as "movies" | "tv") || undefined
      );
      callback({ shows });
    } catch (error) {
      console.error("Error getting streaming content:", error);
      callback({ error: "Failed to get streaming content" });
    }
  });

  // New event handler for getting Netflix content
  socket.on("getNetflixContent", async (data, callback) => {
    try {
      console.log(
        "Client requested Netflix content",
        data?.contentType
          ? `(contentType: ${data.contentType})`
          : "(no contentType)"
      );
      const shows = await tmdbService.getNetflixContent(
        (data?.contentType as "movies" | "tv") || undefined
      );
      callback({ shows });
    } catch (error) {
      console.error("Error getting Netflix content:", error);
      callback({ error: "Failed to get Netflix content" });
    }
  });

  // New event handler for initializing room shows
  socket.on("initializeRoomShows", async (callback) => {
    try {
      const { user, roomCode } = socket.data;
      if (!user || !roomCode) {
        callback({ error: "User not in room" });
        return;
      }

      console.log(
        "Client requested to initialize room shows for room:",
        roomCode
      );

      // Get the room to access its contentType
      const room = roomService.getRoom(roomCode);
      if (!room) {
        callback({ error: "Room not found" });
        return;
      }

      console.log("Room contentType:", room.contentType);

      // Check if room already has shows for the current platform (default to netflix for backward compatibility)
      let roomShows = roomService.getRoomShows(roomCode, "netflix");

      if (!roomShows) {
        // Generate new show list for this room with the correct content type
        console.log(
          "Generating new show list for room:",
          roomCode,
          "contentType:",
          room.contentType
        );
        roomShows = await tmdbService.getStreamingContent(
          "netflix",
          room.contentType
        );
        roomService.setRoomShows(roomCode, "netflix", roomShows);
      } else {
        console.log("Using existing show list for room:", roomCode);
      }

      callback({ shows: roomShows });
    } catch (error) {
      console.error("Error initializing room shows:", error);
      callback({ error: "Failed to initialize room shows" });
    }
  });

  // New event handler for getting detailed show information
  socket.on("getDetailedShowInfo", async (data, callback) => {
    try {
      console.log(
        "Client requested detailed show info for:",
        data.showId,
        "contentType:",
        data.contentType
      );
      const show = await tmdbService.getDetailedShowInfo(
        data.showId,
        (data.contentType as "movies" | "tv") || undefined
      );
      callback({ show });
    } catch (error) {
      console.error("Error getting detailed show info:", error);
      callback({ error: "Failed to get detailed show info" });
    }
  });

  // New event handler for getting show details
  socket.on("getShowDetails", async (data, callback) => {
    try {
      console.log(
        "Client requested show details for:",
        data.showId,
        "contentType:",
        data.contentType
      );
      const show = await tmdbService.getShowDetails(
        data.showId,
        (data.contentType as "movies" | "tv") || undefined
      );
      callback({ show });
    } catch (error) {
      console.error("Error getting show details:", error);
      callback({ error: "Failed to get show details" });
    }
  });

  // New event handler for checking if room exists
  socket.on("checkRoomExists", (data, callback) => {
    try {
      console.log("Client requested to check if room exists:", data.roomCode);
      const roomExists = roomService.roomExists(data.roomCode);
      callback({ exists: roomExists });
    } catch (error) {
      console.error("Error checking room existence:", error);
      callback({ error: "Failed to check room existence" });
    }
  });

  socket.on("requestRoomState", (data) => {
    try {
      console.log("Client requested room state:", data.roomCode);
      const room = roomService.getRoom(data.roomCode);
      if (room) {
        console.log("Sending room state to client:", {
          users: room.users.map((u) => ({ id: u.id, username: u.username })),
          roomCode: room.code,
          contentType: room.contentType,
        });
        socket.emit("roomStateUpdate", {
          users: room.users,
          roomCode: room.code,
          contentType: room.contentType,
        });
      } else {
        console.log("Room not found for state request:", data.roomCode);
      }
    } catch (error) {
      console.error("Error handling room state request:", error);
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
        // Notify other users about the user leaving
        socket.to(roomCode).emit("userLeft", user.id);

        // Also notify other users about the updated room state
        console.log("Sending roomStateUpdate after user disconnect:", {
          users: result.room.users.map((u) => ({
            id: u.id,
            username: u.username,
          })),
          roomCode: result.room.code,
          contentType: result.room.contentType,
        });
        socket.to(roomCode).emit("roomStateUpdate", {
          users: result.room.users,
          roomCode: result.room.code,
          contentType: result.room.contentType,
        });
      }
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

const PORT = process.env.PORT || 3000;

// Pre-load all platforms on server startup
async function initializeServer() {
  try {
    console.log("Server: Starting up and pre-loading all platforms...");
    await tmdbService.preloadAllPlatforms();
    console.log("Server: All platforms pre-loaded successfully!");
  } catch (error) {
    console.error("Server: Error during startup pre-loading:", error);
  }
}

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start pre-loading after server is listening
  initializeServer();
});
