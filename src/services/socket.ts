import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../server/src/types/index.js";

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private static instance: SocketService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
    console.log("Connecting to socket server at:", socketUrl);

    this.socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("Socket connected successfully");
      this.reconnectAttempts = 0;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.io.on("reconnect", (attempt) => {
      console.log("Socket reconnected after", attempt, "attempts");
    });

    this.socket.io.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    this.socket.io.on("reconnect_failed", () => {
      console.error(
        "Failed to reconnect after",
        this.maxReconnectAttempts,
        "attempts"
      );
    });

    this.socket.io.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });

    this.socket.io.on("ping", () => {
      console.log("Ping sent to server");
    });
  }

  private ensureConnected(): Promise<void> {
    if (this.socket.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket.once("connect", () => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        resolve();
      });

      this.socket.once("connect_error", (error) => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        reject(error);
      });

      this.socket.connect();
    });

    return this.connectionPromise;
  }

  async joinRoom(roomCode: string, username: string): Promise<void> {
    try {
      // Ensure we're connected before attempting to join
      await this.ensureConnected();

      // Normalize the room code
      const normalizedRoomCode = roomCode.trim().toUpperCase();

      if (!normalizedRoomCode || normalizedRoomCode.length !== 6) {
        throw new Error("Invalid room code format");
      }

      if (!username.trim()) {
        throw new Error("Username is required");
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Join room timeout"));
        }, 10000);

        this.socket.emit(
          "joinRoom",
          {
            roomCode: normalizedRoomCode,
            username: username.trim(),
          },
          (error) => {
            clearTimeout(timeout);
            if (error) {
              reject(new Error(error));
            } else {
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in joinRoom:", error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.emit("leaveRoom");
    }
  }

  swipe(showId: string, direction: "left" | "right") {
    if (this.socket) {
      this.socket.emit("swipe", { showId, direction });
    }
  }

  onRoomJoined(callback: (room: any) => void) {
    this.socket?.on("roomJoined", callback);
  }

  onUserJoined(callback: (user: any) => void) {
    this.socket?.on("userJoined", callback);
  }

  onUserLeft(callback: (userId: string) => void) {
    this.socket?.on("userLeft", callback);
  }

  onSwipeUpdate(callback: (swipe: any) => void) {
    this.socket?.on("swipeUpdate", callback);
  }

  onMatchFound(callback: (showId: string) => void) {
    this.socket?.on("matchFound", callback);
  }

  onError(callback: (message: string) => void) {
    this.socket?.on("error", callback);
  }

  offRoomJoined(callback: (room: any) => void) {
    this.socket?.off("roomJoined", callback);
  }

  offUserJoined(callback: (user: any) => void) {
    this.socket?.off("userJoined", callback);
  }

  offUserLeft(callback: (userId: string) => void) {
    this.socket?.off("userLeft", callback);
  }

  offSwipeUpdate(callback: (swipe: any) => void) {
    this.socket?.off("swipeUpdate", callback);
  }

  offMatchFound(callback: (showId: string) => void) {
    this.socket?.off("matchFound", callback);
  }

  offError(callback: (message: string) => void) {
    this.socket?.off("error", callback);
  }
}

export const socketService = new SocketService();
