import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomEntry from "@/components/RoomEntry";
import Swipe from "./Swipe";
import { socketService } from "@/services/socket";
import { useToast } from "@/hooks/use-toast";
import { ContentType } from "@/components/ContentTypeSelector";
import { Room } from "@/types/show";
import { User } from "../../server/src/types/index.js";

export default function Index() {
  const [isConnecting, setIsConnecting] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
  };

  const handleLeaveRoom = () => {
    // Clear room state to return to home page
    setRoom(null);
    setUser(null);
    setContentType(null);

    // Also leave the room via socket
    socketService.leaveRoom();
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Connecting to server...</p>
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
