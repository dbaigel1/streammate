import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  Room,
  User,
} from "../../server/src/types/index.js";

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private static instance: SocketService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionPromise: Promise<void> | null = null;
  private isConnecting = false;
  private lastRoomCode: string | null = null;
  private lastUsername: string | null = null;

  private constructor() {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
    console.log("Initializing socket connection to:", socketUrl);

    this.socket = io(socketUrl, {
      transports: ["polling", "websocket"],
      path: "/socket.io/",
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", {
        id: this.socket?.id,
        transport: this.socket?.io?.engine?.transport?.name,
      });
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      // Attempt to rejoin room if we have stored credentials
      if (this.lastRoomCode && this.lastUsername) {
        console.log("Attempting to rejoin room after reconnection");
        this.joinRoom(this.lastRoomCode, this.lastUsername).catch((error) => {
          console.error("Failed to rejoin room after reconnection:", error);
        });
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.reconnectAttempts++;
      this.isConnecting = false;

      // If we're using websocket and it fails, try polling
      if (this.socket?.io?.engine?.transport?.name === "websocket") {
        console.log("WebSocket failed, switching to polling transport");
        if (this.socket.io) {
          this.socket.io.opts.transports = ["polling"];
        }
        this.socket?.connect();
      }
    });

    this.socket.io?.engine?.on("upgrade", (transport) => {
      console.log("Transport upgraded to:", transport.name);
    });

    this.socket.io?.engine?.on("upgradeError", (error) => {
      console.error("Transport upgrade error:", error);
      // Fall back to polling if upgrade fails
      if (this.socket?.io?.engine?.transport?.name === "websocket") {
        console.log("Upgrade failed, falling back to polling");
        if (this.socket.io) {
          this.socket.io.opts.transports = ["polling"];
        }
        this.socket?.connect();
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      this.isConnecting = false;

      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        console.log("Server initiated disconnect, attempting to reconnect...");
        this.socket?.connect();
      }
    });

    this.socket.io?.on("reconnect", (attempt) => {
      console.log("Socket reconnected after", attempt, "attempts");
    });

    this.socket.io?.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    this.socket.io?.on("reconnect_failed", () => {
      console.error(
        "Failed to reconnect after",
        this.maxReconnectAttempts,
        "attempts"
      );
    });

    this.socket.io?.on("error", (error) => {
      console.error("Socket.IO error:", error);
    });

    this.socket.io?.on("ping", () => {
      console.log("Ping sent to server");
    });
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private ensureConnected(): Promise<void> {
    console.log("ensureConnected called, current status:", {
      connected: this.socket?.connected,
      id: this.socket?.id,
      isConnecting: this.isConnecting,
      transport: this.socket?.io?.engine?.transport?.name,
    });

    if (this.socket?.connected) {
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
        console.error("Connection timeout reached");
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(new Error("Connection timeout - please try again"));
      }, 15000);

      const connectHandler = () => {
        console.log("Socket connected in ensureConnected", {
          id: this.socket?.id,
          transport: this.socket?.io?.engine?.transport?.name,
        });
        clearTimeout(timeout);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.socket?.off("connect", connectHandler);
        this.socket?.off("connect_error", errorHandler);
        resolve();
      };

      const errorHandler = (error: Error) => {
        console.error("Connection error in ensureConnected:", {
          error,
          transport: this.socket?.io?.engine?.transport?.name,
        });
        clearTimeout(timeout);
        this.isConnecting = false;
        this.connectionPromise = null;
        this.socket?.off("connect", connectHandler);
        this.socket?.off("connect_error", errorHandler);
        reject(error);
      };

      this.socket?.once("connect", connectHandler);
      this.socket?.once("connect_error", errorHandler);
      this.socket?.connect();
    });

    return this.connectionPromise;
  }

  public connect() {
    console.log("Manual connect called, current status:", {
      connected: this.socket?.connected,
      id: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
    });
    this.socket?.connect();
  }

  public disconnect() {
    this.socket?.disconnect();
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public async joinRoom(roomCode: string, username: string): Promise<void> {
    try {
      console.log("Attempting to join room:", { roomCode, username });

      // Store credentials for reconnection
      this.lastRoomCode = roomCode;
      this.lastUsername = username;

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
        this.socket?.emit(
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
      // Clear stored credentials on error
      this.lastRoomCode = null;
      this.lastUsername = null;
      throw error;
    }
  }

  public leaveRoom() {
    console.log("Leaving room");
    this.lastRoomCode = null;
    this.lastUsername = null;
    this.socket?.emit("leaveRoom");
  }

  public swipe(showId: string, direction: "left" | "right") {
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

  onMatchFound(
    callback: (data: { showId: string; matchedUsers: string[] }) => void
  ) {
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

  offMatchFound(
    callback: (data: { showId: string; matchedUsers: string[] }) => void
  ) {
    this.socket?.off("matchFound", callback);
  }

  offError(callback: (message: string) => void) {
    this.socket?.off("error", callback);
  }
}

export const socketService = SocketService.getInstance();
export const socket = socketService.getSocket();
