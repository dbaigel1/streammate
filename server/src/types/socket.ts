import { Room, User, SwipeData } from "./index.js";

export interface ClientToServerEvents {
  createRoom: (
    data: { username: string },
    callback: (response: { room: Room; user: User } | { error: string }) => void
  ) => void;
  joinRoom: (
    data: { username: string; roomCode: string },
    callback: (error?: string) => void
  ) => void;
  leaveRoom: () => void;
  swipe: (data: { showId: string; direction: "left" | "right" }) => void;
}

export interface ServerToClientEvents {
  roomJoined: (data: { room: Room; user: User }) => void;
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  swipeUpdate: (swipe: Omit<SwipeData, "timestamp">) => void;
  matchFound: (data: { showId: string; matchedUsers: string[] }) => void;
  error: (message: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: User | null;
  roomCode: string | null;
}
