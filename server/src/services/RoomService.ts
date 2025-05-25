import { Room, User, SwipeData } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map(); // userId -> roomCode
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

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
      matches: [],
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, room);
    this.userToRoom.set(userId, roomCode);
    this.socketToUser.set(socketId, userId);

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

    // Check if this socket is reconnecting
    const existingUserId = this.socketToUser.get(socketId);
    if (existingUserId) {
      const existingUser = room.users.find((u) => u.id === existingUserId);
      if (existingUser) {
        // Update socket ID for existing user
        existingUser.socketId = socketId;
        console.log("User reconnected:", { userId: existingUserId, socketId });
        return { room, user: existingUser };
      }
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
    this.socketToUser.set(socketId, userId);

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

    // Remove socket mapping
    this.socketToUser.delete(user.socketId);

    room.users.splice(userIndex, 1);
    this.userToRoom.delete(userId);

    // If room is empty, delete it
    if (room.users.length === 0) {
      this.rooms.delete(roomCode);
      return { room: null, user };
    }

    return { room, user };
  }

  public addSwipe(
    roomCode: string,
    swipe: SwipeData
  ): { isMatch: boolean; matchedUsers?: string[] } {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error("Room not found");
    }

    // Add the swipe to the room's swipes
    if (!room.swipes) {
      room.swipes = [];
    }
    room.swipes.push(swipe);

    // Check for matches only if the swipe is a right swipe
    if (swipe.direction === "right") {
      // Get all right swipes for this show from other users
      const otherRightSwipes = room.swipes.filter(
        (s) =>
          s.showId === swipe.showId &&
          s.direction === "right" &&
          s.userId !== swipe.userId
      );

      // If there are other right swipes, we have a match
      if (otherRightSwipes.length > 0) {
        // Get all users who matched (including the current user)
        const matchedUsers = [
          swipe.userId,
          ...otherRightSwipes.map((s) => s.userId),
        ];

        // Add the match to the room's matches if it doesn't exist
        if (!room.matches) {
          room.matches = [];
        }

        // Only add the match if it's not already recorded
        const matchExists = room.matches.some(
          (m) =>
            m.showId === swipe.showId &&
            m.users.every((u) => matchedUsers.includes(u))
        );

        if (!matchExists) {
          room.matches.push({
            showId: swipe.showId,
            users: matchedUsers,
            timestamp: new Date().toISOString(),
          });
        }

        return { isMatch: true, matchedUsers };
      }
    }

    return { isMatch: false };
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
