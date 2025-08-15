import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomEntry from "@/components/RoomEntry";
import Swipe from "./Swipe";
import { socketService } from "@/services/socket";
import { useToast } from "@/hooks/use-toast";
import { ContentType } from "@/components/ContentTypeSelector";
import { Room } from "@/types/show";
import { User } from "../../server/src/types/index.js";

// Local storage keys
const ROOM_STORAGE_KEY = "streammate_room";
const USER_STORAGE_KEY = "streammate_user";
const CONTENT_TYPE_STORAGE_KEY = "streammate_contentType";

export default function Index() {
  const [isConnecting, setIsConnecting] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [isRestoringRoom, setIsRestoringRoom] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Save room state to localStorage
  const saveRoomState = (
    roomData: Room,
    userData: User,
    contentTypeData: ContentType
  ) => {
    try {
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(roomData));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(CONTENT_TYPE_STORAGE_KEY, contentTypeData);
    } catch (error) {
      console.error("Failed to save room state to localStorage:", error);
    }
  };

  // Restore room state from localStorage
  const restoreRoomState = (): {
    room: Room | null;
    user: User | null;
    contentType: ContentType | null;
  } => {
    try {
      const roomData = localStorage.getItem(ROOM_STORAGE_KEY);
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      const contentTypeData = localStorage.getItem(CONTENT_TYPE_STORAGE_KEY);

      if (roomData && userData && contentTypeData) {
        const room = JSON.parse(roomData);
        const user = JSON.parse(userData);
        const contentType = contentTypeData as ContentType;

        // Validate the restored data
        if (room?.code && user?.username && contentType) {
          return { room, user, contentType };
        }
      }
    } catch (error) {
      console.error("Failed to restore room state from localStorage:", error);
    }
    return { room: null, user: null, contentType: null };
  };

  // Clear room state from localStorage
  const clearRoomState = () => {
    try {
      localStorage.removeItem(ROOM_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(CONTENT_TYPE_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear room state from localStorage:", error);
    }
  };

  useEffect(() => {
    console.log("=== INDEX USE_EFFECT RUNNING ===");
    console.log("Current state:", { isConnecting, room, user, contentType });

    const initializeSocket = async () => {
      try {
        console.log("Initializing socket connection...");
        setIsConnecting(true);
        await socketService.connect();
        console.log("Socket connected successfully");
        setIsConnecting(false);

        // After socket connects, try to restore room state
        const restoredState = restoreRoomState();
        if (
          restoredState.room &&
          restoredState.user &&
          restoredState.contentType
        ) {
          console.log("Restoring room state from localStorage:", restoredState);
          setIsRestoringRoom(true);

          try {
            // Attempt to rejoin the room
            await socketService.joinRoom(
              restoredState.room.code,
              restoredState.user.username,
              restoredState.contentType
            );

            // If successful, restore the state
            setRoom(restoredState.room);
            setUser(restoredState.user);
            setContentType(restoredState.contentType);
            console.log("Successfully restored room state");
          } catch (error) {
            console.error("Failed to rejoin room:", error);
            // If rejoining fails, clear the stored state
            clearRoomState();
            toast({
              title: "Room Rejoin Failed",
              description:
                "Could not rejoin your previous room. Please create or join a new room.",
              variant: "destructive",
            });
          } finally {
            setIsRestoringRoom(false);
          }
        }
      } catch (error) {
        console.error("Failed to connect to socket:", error);
        setIsConnecting(false);
        toast({
          title: "Connection Error",
          description:
            "Failed to connect to server. Please refresh and try again.",
          variant: "destructive",
        });
      }
    };

    initializeSocket();
  }, [toast]);

  const handleJoinRoom = (
    roomCode: string,
    username: string,
    selectedContentType?: ContentType
  ) => {
    // If contentType is provided, use it (for room creation)
    // If not provided, we'll get it from the room when we join
    if (selectedContentType) {
      setContentType(selectedContentType);
    }

    // Create a temporary room and user for immediate display
    const tempRoom: Room = {
      id: roomCode,
      code: roomCode,
      users: [{ id: "temp", username, socketId: "temp" }],
      swipes: [],
      matches: [],
      contentType: selectedContentType || "tv", // Default to tv if not provided
      createdAt: new Date(),
    };

    const tempUser = { id: "temp", username, socketId: "temp" };

    setRoom(tempRoom);
    setUser(tempUser);

    // Save room state to localStorage for persistence
    // Note: For joining existing rooms, we'll update this with the real contentType later
    saveRoomState(tempRoom, tempUser, selectedContentType || "tv");
  };

  const handleLeaveRoom = () => {
    // Clear room state to return to home page
    setRoom(null);
    setUser(null);
    setContentType(null);

    // Clear stored room state from localStorage
    clearRoomState();

    // Also leave the room via socket
    socketService.leaveRoom();
  };

  if (isConnecting || isRestoringRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">
            {isRestoringRoom
              ? "Rejoining your room..."
              : "Connecting to server..."}
          </p>
        </div>
      </div>
    );
  }

  // If we have a room and user, show the swipe interface
  if (room && user) {
    return <Swipe room={room} user={user} onLeaveRoom={handleLeaveRoom} />;
  }

  // Otherwise show the room entry form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
      <RoomEntry onJoinRoom={handleJoinRoom} isConnecting={isConnecting} />
    </div>
  );
}
