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
  private isConnecting = false;

  constructor() {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
    console.log("Initializing socket service with URL:", socketUrl);

    this.socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", this.socket.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      this.reconnectAttempts++;
      this.isConnecting = false;

      // Try polling if websocket fails
      if (this.socket.io.opts.transports?.[0] === "websocket") {
        console.log("Falling back to polling transport");
        this.socket.io.opts.transports = ["polling", "websocket"];
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnecting = false;

      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        console.log("Server initiated disconnect, attempting to reconnect...");
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
      console.log("Socket already connected");
      return Promise.resolve();
    }

    if (this.isConnecting) {
      console.log("Socket connection in progress, waiting...");
      return (
        this.connectionPromise ||
        Promise.reject(new Error("Connection in progress"))
      );
    }

    this.isConnecting = true;
    console.log("Initiating socket connection...");

    this.connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(new Error("Connection timeout - please try again"));
      }, 15000);

      this.socket.once("connect", () => {
        console.log("Socket connected in ensureConnected");
        clearTimeout(timeout);
        this.isConnecting = false;
        this.connectionPromise = null;
        resolve();
      });

      this.socket.once("connect_error", (error) => {
        console.error("Connection error in ensureConnected:", error);
        clearTimeout(timeout);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      });

      this.socket.connect();
    });

    return this.connectionPromise;
  }

  async joinRoom(roomCode: string, username: string): Promise<void> {
    try {
      console.log("Attempting to join room:", { roomCode, username });

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
          reject(new Error("Join room timeout - please try again"));
        }, 15000);

        console.log("Emitting joinRoom event...");
        this.socket.emit(
          "joinRoom",
          {
            roomCode: normalizedRoomCode,
            username: username.trim(),
          },
          (error) => {
            clearTimeout(timeout);
            if (error) {
              console.error("Error in joinRoom callback:", error);
              reject(new Error(error));
            } else {
              console.log("Successfully joined room");
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
