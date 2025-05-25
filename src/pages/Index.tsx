import React, { useState, useEffect } from "react";
import SwipeCard from "@/components/SwipeCard";
import MatchScreen from "@/components/MatchScreen";
import UserIndicator from "@/components/UserIndicator";
import RoomEntry from "@/components/RoomEntry";
import RoomStatus from "@/components/RoomStatus";
import { Show, SwipeData, Room } from "@/types/show";
import { mockShows } from "@/data/mockShows";
import { socket } from "../services/socket";
import { useToast } from "@/components/ui/use-toast";
import { User } from "../../server/src/types/index.js";
import { useNavigate } from "react-router-dom";
import { tmdbService } from "../services/tmdb";
import ShowCard from "../components/ShowCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [shows, setShows] = useState<Show[]>([]);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isLoadingShows, setIsLoadingShows] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Socket event listeners
    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnecting(false);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnecting(true);
    });

    socket.on("roomJoined", (roomData: Room, user: User) => {
      console.log("Joined room:", roomData);
      setRoom(roomData);
      setCurrentUser(user);
      setIsConnecting(false);
      // Load shows when joining a room
      loadShows();
    });

    socket.on("userJoined", (user: User) => {
      console.log("User joined:", user);
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          users: [...prev.users, user],
        };
      });
    });

    socket.on("userLeft", (userId: string) => {
      console.log("User left:", userId);
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.filter((u) => u.id !== userId),
        };
      });
    });

    socket.on("swipeUpdate", (swipeData: SwipeData) => {
      console.log("Swipe update:", swipeData);
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          swipes: [...prev.swipes, swipeData],
        };
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("roomJoined");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("swipeUpdate");
    };
  }, []);

  const loadShows = async () => {
    setIsLoadingShows(true);
    try {
      const netflixShows = await tmdbService.getNetflixContent();
      setShows(netflixShows);
      setCurrentShowIndex(0);
    } catch (error) {
      console.error("Error loading shows:", error);
    } finally {
      setIsLoadingShows(false);
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!room || !currentUser || isSwiping) return;

    setIsSwiping(true);
    const currentShow = shows[currentShowIndex];

    // Emit swipe event
    socket.emit("swipe", {
      roomId: room.id,
      showId: currentShow.id,
      direction,
      userId: currentUser.id,
      timestamp: new Date(),
    });

    // Move to next show after a short delay
    setTimeout(() => {
      setCurrentShowIndex((prev) => prev + 1);
      setIsSwiping(false);
    }, 300);
  };

  const handleLeaveRoom = () => {
    if (room && currentUser) {
      socket.emit("leaveRoom", { roomId: room.id, userId: currentUser.id });
    }
    setRoom(null);
    setCurrentUser(null);
    setShows([]);
    setCurrentShowIndex(0);
  };

  if (!room || !currentUser) {
    return <RoomEntry isConnecting={isConnecting} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <RoomStatus room={room} currentUser={currentUser} />
        <Button variant="outline" onClick={handleLeaveRoom}>
          Leave Room
        </Button>
      </div>

      <div className="mb-8">
        <UserIndicator users={room.users} currentUser={currentUser} />
      </div>

      <div className="relative min-h-[600px]">
        {isLoadingShows ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading shows...</span>
          </div>
        ) : currentShowIndex < shows.length ? (
          <ShowCard
            show={shows[currentShowIndex]}
            onSwipe={handleSwipe}
            isSwiping={isSwiping}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No more shows!</h2>
            <p className="text-gray-600 mb-4">
              You've gone through all available shows. Check back later for more
              content.
            </p>
            <Button onClick={loadShows}>Load More Shows</Button>
          </div>
        )}
      </div>
    </div>
  );
}
