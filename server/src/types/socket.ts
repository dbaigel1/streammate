import { Room, User } from "./index.js";

export interface ClientToServerEvents {
  createRoom: (
    data: { username: string },
    callback: (response: { room: Room; user: User } | { error: string }) => void
  ) => void;
  joinRoom: (
    data: { roomCode: string; username: string },
    callback: (error?: string) => void
  ) => void;
  leaveRoom: () => void;
  swipe: (data: { showId: string; direction: "left" | "right" }) => void;
}

export interface ServerToClientEvents {
  roomJoined: (data: { room: Room; user: User }) => void;
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  swipeUpdate: (data: {
    userId: string;
    showId: string;
    direction: "left" | "right";
  }) => void;
  matchFound: (showId: string) => void;
  error: (message: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: User | null;
  roomCode: string | null;
}
