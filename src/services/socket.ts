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
    console.log("=== SOCKET SERVICE CONSTRUCTOR CALLED ===");
    console.log("Socket URL:", socketUrl);
    console.log("Stack trace:", new Error().stack);

    this.socket = io(socketUrl, {
      transports: ["polling"], // Start with polling only to avoid upgrade issues
      path: "/socket.io/",
      reconnectionAttempts: 0, // Disable reconnection completely
      reconnectionDelay: 0,
      timeout: 20000,
      forceNew: false, // Don't force new connections
      withCredentials: false,
      autoConnect: false, // Don't auto-connect, we'll do it manually
    });

    console.log("Socket instance created:", this.socket.id);

    this.socket.on("connect", () => {
      console.log("=== SOCKET CONNECTED ===");
      console.log("Socket ID:", this.socket?.id);
      console.log("Transport:", this.socket?.io?.engine?.transport?.name);
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
      console.error("=== SOCKET CONNECTION ERROR ===", error);
      this.reconnectAttempts++;
      this.isConnecting = false;

      // Don't auto-reconnect on error, let the user handle it
      console.log("Connection failed, not auto-reconnecting");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("=== SOCKET DISCONNECTED ===");
      console.log("Reason:", reason);
      console.log("Socket ID before disconnect:", this.socket?.id);
      console.log(
        "Transport before disconnect:",
        this.socket?.io?.engine?.transport?.name
      );
      console.log("Stack trace:", new Error().stack);
      this.isConnecting = false;

      // Log disconnect reason and don't auto-reconnect
      console.log("Client disconnected, not auto-reconnecting");
      console.log("Disconnect reason details:", {
        reason,
        shouldReconnect: false,
      });
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
      console.log("=== CREATING NEW SOCKET SERVICE INSTANCE ===");
      SocketService.instance = new SocketService();
    } else {
      console.log("=== REUSING EXISTING SOCKET SERVICE INSTANCE ===");
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

  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket?.connected) {
      console.log("Socket already connected");
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not initialized"));
        return;
      }

      this.isConnecting = true;
      console.log("Manually connecting socket...");

      const timeout = setTimeout(() => {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(new Error("Connection timeout"));
      }, 15000);

      const connectHandler = () => {
        clearTimeout(timeout);
        this.socket?.off("connect", connectHandler);
        this.socket?.off("connect_error", errorHandler);
        this.connectionPromise = null;
        resolve();
      };

      const errorHandler = (error: Error) => {
        clearTimeout(timeout);
        this.socket?.off("connect", connectHandler);
        this.socket?.off("connect_error", errorHandler);
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      };

      this.socket.once("connect", connectHandler);
      this.socket.once("connect_error", errorHandler);

      // Manually connect since autoConnect is disabled
      this.socket.connect();
    });

    return this.connectionPromise;
  }

  public disconnect() {
    this.socket?.disconnect();
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public async createRoom(
    username: string,
    contentType: string
  ): Promise<{ room: any; user: any } | { error: string }> {
    return new Promise((resolve, reject) => {
      console.log("createRoom called with:", { username, contentType });
      console.log("Socket status:", {
        connected: this.socket?.connected,
        id: this.socket?.id,
        transport: this.socket?.io?.engine?.transport?.name,
      });

      if (!this.socket?.connected) {
        console.error("Socket not connected, rejecting");
        reject(new Error("Socket not connected"));
        return;
      }

      // Add timeout to handle cases where server doesn't respond
      const timeout = setTimeout(() => {
        console.error("createRoom timeout - no response from server");
        reject(new Error("Server timeout - no response received"));
      }, 10000); // 10 second timeout

      console.log("Emitting createRoom event...");
      this.socket.emit(
        "createRoom",
        { username, contentType },
        (response: { room: any; user: any } | { error: string }) => {
          console.log("createRoom callback received:", response);
          clearTimeout(timeout);

          if (!response) {
            console.error(
              "createRoom callback received null/undefined response"
            );
            reject(new Error("Invalid response from server"));
            return;
          }

          if ("error" in response) {
            resolve({ error: response.error });
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  public async joinRoom(
    roomCode: string,
    username: string,
    contentType: string
  ): Promise<{ error?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "joinRoom",
        { username, roomCode, contentType },
        (response: string | undefined) => {
          if (response) {
            // response is a string error message
            resolve({ error: response });
          } else {
            // response is undefined, which means success
            resolve({});
          }
        }
      );
    });
  }

  public leaveRoom() {
    console.log("Leaving room");
    this.lastRoomCode = null;
    this.lastUsername = null;
    this.socket?.emit("leaveRoom");
  }

  public swipe(showId: string, direction: "left" | "right"): void {
    if (!this.socket?.connected) {
      console.error("Socket not connected");
      return;
    }

    // Ensure showId is normalized as string
    const normalizedShowId = String(showId);

    console.log("Socket: Emitting swipe event:", {
      showId: normalizedShowId,
      direction,
    });

    this.socket.emit("swipe", {
      showId: normalizedShowId,
      direction,
    });
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

  public async initializeRoomShows(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "initializeRoomShows",
        (response: { shows: any[] } | { error: string }) => {
          if ("error" in response) {
            reject(new Error(response.error));
          } else {
            resolve(response.shows);
          }
        }
      );
    });
  }

  public async getNetflixContent(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "getNetflixContent",
        (response: { shows: any[] } | { error: string }) => {
          if ("error" in response) {
            reject(new Error(response.error));
          } else {
            resolve(response.shows);
          }
        }
      );
    });
  }

  public async getShowDetails(
    showId: string,
    contentType: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "getShowDetails",
        { showId, contentType },
        (response: { show: any } | { error: string }) => {
          if ("error" in response) {
            reject(new Error(response.error));
          } else {
            resolve(response.show);
          }
        }
      );
    });
  }
}

export const socketService = SocketService.getInstance();
export const socket = socketService.getSocket();
