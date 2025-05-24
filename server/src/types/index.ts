export interface User {
  id: string;
  username: string;
  socketId: string;
}

export interface Room {
  code: string;
  users: User[];
  swipes: SwipeData[];
  createdAt: Date;
}

export interface SwipeData {
  showId: string;
  direction: "left" | "right";
  userId: string;
  timestamp: Date;
}

export interface ServerToClientEvents {
  roomJoined: (room: Room) => void;
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  swipeUpdate: (swipe: SwipeData) => void;
  matchFound: (showId: string) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (
    data: { roomCode: string; username: string },
    callback: (error?: string) => void
  ) => void;
  leaveRoom: () => void;
  swipe: (data: { showId: string; direction: "left" | "right" }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  roomCode: string | null;
}
