import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../server/src/types/index.js";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      withCredentials: true,
      forceNew: true,
    });

    this.socket.on("connect", () => {
      console.log("Connected to server with ID:", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      // Try to reconnect with polling if websocket fails
      if (this.socket?.io.opts.transports?.[0] === "websocket") {
        console.log("Falling back to polling transport");
        this.socket.io.opts.transports = ["polling", "websocket"];
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.io.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
    });

    this.socket.io.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    this.socket.io.on("reconnect_failed", () => {
      console.error("Failed to reconnect");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomCode: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit("joinRoom", { roomCode, username }, (error) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
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
