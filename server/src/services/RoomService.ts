import { Room, User, SwipeData } from "../types/index.js";
import { v4 as uuidv4 } from "uuid";

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map(); // userId -> roomCode
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId
  private roomShows: Map<string, any[]> = new Map(); // Store show list per room

  createRoom(
    username: string,
    socketId: string,
    contentType: "movies" | "tv"
  ): { room: Room; user: User } {
    const roomCode = this.generateRoomCode();
    const userId = uuidv4();

    const user: User = {
      id: userId,
      username,
      socketId,
    };

    const room: Room = {
      id: roomCode,
      code: roomCode,
      users: [user],
      swipes: [],
      matches: [],
      contentType: contentType,
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

    // Ensure showId is a string for consistent comparison
    const normalizedShowId = String(swipe.showId);

    console.log("RoomService: Processing swipe:", {
      originalShowId: swipe.showId,
      normalizedShowId: normalizedShowId,
      userId: swipe.userId,
      direction: swipe.direction,
      roomCode: roomCode,
    });

    // Add the swipe to the room's swipes
    if (!room.swipes) {
      room.swipes = [];
    }

    // Store the swipe with normalized showId
    const normalizedSwipe = {
      ...swipe,
      showId: normalizedShowId,
    };
    room.swipes.push(normalizedSwipe);

    console.log(
      "RoomService: Added swipe to room. Total swipes:",
      room.swipes.length
    );

    // Check for matches only if the swipe is a right swipe
    if (swipe.direction === "right") {
      console.log(
        "RoomService: Checking for matches on showId:",
        normalizedShowId
      );

      // Get all right swipes for this show from other users
      const otherRightSwipes = room.swipes.filter(
        (s) =>
          String(s.showId) === normalizedShowId &&
          s.direction === "right" &&
          s.userId !== swipe.userId
      );

      console.log(
        "RoomService: Found other right swipes:",
        otherRightSwipes.length
      );
      otherRightSwipes.forEach((s) => {
        console.log("  - User:", s.userId, "on showId:", s.showId);
      });

      // If there are other right swipes, we have a match
      if (otherRightSwipes.length > 0) {
        // Get all users who matched (including the current user)
        const matchedUsers = [
          swipe.userId,
          ...otherRightSwipes.map((s) => s.userId),
        ];

        console.log("RoomService: MATCH FOUND!", {
          showId: normalizedShowId,
          matchedUsers: matchedUsers,
          allSwipesInRoom: room.swipes.map((s) => ({
            userId: s.userId,
            showId: s.showId,
            direction: s.direction,
          })),
        });

        // Add the match to the room's matches if it doesn't exist
        if (!room.matches) {
          room.matches = [];
        }

        // Only add the match if it's not already recorded
        const matchExists = room.matches.some(
          (m) =>
            String(m.showId) === normalizedShowId &&
            m.users.every((u) => matchedUsers.includes(u))
        );

        if (!matchExists) {
          room.matches.push({
            showId: normalizedShowId,
            users: matchedUsers,
            timestamp: new Date().toISOString(),
          });
          console.log("RoomService: Added new match to room matches");
        } else {
          console.log(
            "RoomService: Match already exists, not adding duplicate"
          );
        }

        return { isMatch: true, matchedUsers };
      }
    }

    return { isMatch: false };
  }

  public setRoomShows(roomCode: string, shows: any[]): void {
    this.roomShows.set(roomCode, shows);
    console.log(`RoomService: Set ${shows.length} shows for room ${roomCode}`);
  }

  public getRoomShows(roomCode: string): any[] | null {
    return this.roomShows.get(roomCode) || null;
  }

  public clearRoomShows(roomCode: string): void {
    this.roomShows.delete(roomCode);
    console.log(`RoomService: Cleared shows for room ${roomCode}`);
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
