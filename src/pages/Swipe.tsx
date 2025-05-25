import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Room, User } from "../../server/src/types/index.js";
import { Show } from "@/types/show";
import { socketService } from "@/services/socket";
import { tmdbService } from "@/services/tmdb";
import ShowCard from "@/components/ShowCard";
import UserIndicator from "@/components/UserIndicator";
import RoomStatus from "@/components/RoomStatus";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LocationState {
  room: Room;
  user: User;
  isHost: boolean;
}

export default function Swipe() {
  const location = useLocation();
  const navigate = useNavigate();
  const { room, user, isHost } = location.state as LocationState;

  const [shows, setShows] = useState<Show[]>([]);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isLoadingShows, setIsLoadingShows] = useState(false);
  const [roomUsers, setRoomUsers] = useState<User[]>(room.users);

  useEffect(() => {
    // Load shows when component mounts
    loadShows();

    // Socket event listeners
    const socket = socketService.getSocket();

    socket?.on("userJoined", (newUser: User) => {
      console.log("User joined:", newUser);
      setRoomUsers((prev) => [...prev, newUser]);
    });

    socket?.on("userLeft", (userId: string) => {
      console.log("User left:", userId);
      setRoomUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    socket?.on("swipeUpdate", (swipeData) => {
      console.log("Swipe update:", swipeData);
      // Handle swipe updates if needed
    });

    socket?.on("matchFound", (showId: string) => {
      console.log("Match found for show:", showId);
      // Handle match found if needed
    });

    return () => {
      socket?.off("userJoined");
      socket?.off("userLeft");
      socket?.off("swipeUpdate");
      socket?.off("matchFound");
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
    if (isSwiping) return;

    setIsSwiping(true);
    const currentShow = shows[currentShowIndex];

    // Emit swipe event
    socketService.swipe(currentShow.id, direction);

    // Move to next show after a short delay
    setTimeout(() => {
      setCurrentShowIndex((prev) => prev + 1);
      setIsSwiping(false);
    }, 300);
  };

  const handleLeaveRoom = () => {
    socketService.leaveRoom();
    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <RoomStatus room={{ ...room, users: roomUsers }} currentUser={user} />
        <Button variant="outline" onClick={handleLeaveRoom}>
          Leave Room
        </Button>
      </div>

      <div className="mb-8">
        <UserIndicator users={roomUsers} currentUser={user} />
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
