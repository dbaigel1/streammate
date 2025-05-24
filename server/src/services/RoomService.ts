import { Room, User, SwipeData } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map(); // userId -> roomCode

  createRoom(username: string, socketId: string): { room: Room; user: User } {
    const roomCode = this.generateRoomCode();
    const userId = uuidv4();

    const user: User = {
      id: userId,
      username,
      socketId,
    };

    const room: Room = {
      code: roomCode,
      users: [user],
      swipes: [],
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, room);
    this.userToRoom.set(userId, roomCode);

    return { room, user };
  }

  joinRoom(
    roomCode: string,
    username: string,
    socketId: string
  ): { room: Room; user: User } | null {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return null;
    }

    // Check if username is already taken in the room
    if (room.users.some((u: User) => u.username === username)) {
      throw new Error("Username is already taken in this room");
    }

    const userId = uuidv4();
    const user: User = {
      id: userId,
      username,
      socketId,
    };

    room.users.push(user);
    this.userToRoom.set(userId, roomCode);

    return { room, user };
  }

  leaveRoom(userId: string): { room: Room | null; user: User | null } {
    const roomCode = this.userToRoom.get(userId);
    if (!roomCode) {
      return { room: null, user: null };
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      return { room: null, user: null };
    }

    const userIndex = room.users.findIndex((u: User) => u.id === userId);
    if (userIndex === -1) {
      return { room: null, user: null };
    }

    const user = room.users[userIndex];
    room.users.splice(userIndex, 1);
    this.userToRoom.delete(userId);

    // If room is empty, delete it
    if (room.users.length === 0) {
      this.rooms.delete(roomCode);
      return { room: null, user };
    }

    return { room, user };
  }

  addSwipe(
    roomCode: string,
    swipe: Omit<SwipeData, "timestamp">
  ): { room: Room; isMatch: boolean } | null {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return null;
    }

    const swipeWithTimestamp: SwipeData = {
      ...swipe,
      timestamp: new Date(),
    };

    room.swipes.push(swipeWithTimestamp);

    // Check for match if it's a right swipe
    let isMatch = false;
    if (swipe.direction === "right") {
      const rightSwipesForShow = room.swipes.filter(
        (s: SwipeData) => s.showId === swipe.showId && s.direction === "right"
      );

      const usersWhoSwipedRight = new Set(
        rightSwipesForShow.map((s: SwipeData) => s.userId)
      );

      isMatch = usersWhoSwipedRight.size === room.users.length;
    }

    return { room, isMatch };
  }

  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null;
  }

  getUserRoom(userId: string): Room | null {
    const roomCode = this.userToRoom.get(userId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode) || null;
  }

  private generateRoomCode(): string {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Ensure code is unique
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }
}
