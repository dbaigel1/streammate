import React, { useState, useEffect } from "react";
import SwipeCard from "@/components/SwipeCard";
import MatchScreen from "@/components/MatchScreen";
import UserIndicator from "@/components/UserIndicator";
import RoomEntry from "@/components/RoomEntry";
import RoomStatus from "@/components/RoomStatus";
import { Show, SwipeData, Room } from "@/types/show";
import { mockShows } from "@/data/mockShows";
import { socketService } from "@/services/socket";
import { useToast } from "@/components/ui/use-toast";
import { User } from "../../server/src/types/index.js";

const Index: React.FC = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [matchedShow, setMatchedShow] = useState<Show | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const currentShow = mockShows[currentShowIndex];

  useEffect(() => {
    let mounted = true;

    // Debug logging for connection state
    console.log("Index component mounted, setting up socket listeners");

    // Set up socket event listeners
    socketService.onRoomJoined((room) => {
      console.log("Room joined:", room);
      if (mounted) {
        setRoom(room);
        setIsConnecting(false);
      }
    });

    socketService.onUserJoined((user) => {
      console.log("User joined:", user);
      if (mounted && room) {
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                users: [...prev.users, user],
              }
            : null
        );
      }
    });

    socketService.onUserLeft((userId) => {
      console.log("User left:", userId);
      if (mounted && room) {
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                users: prev.users.filter((u) => u.id !== userId),
              }
            : null
        );
      }
    });

    socketService.onSwipeUpdate((swipe) => {
      console.log("Swipe update:", swipe);
      if (mounted && room) {
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                swipes: [
                  ...prev.swipes,
                  {
                    showId: swipe.showId,
                    direction: swipe.direction,
                    user: swipe.userId,
                  },
                ],
              }
            : null
        );
      }
    });

    socketService.onMatchFound((showId) => {
      console.log("Match found for show:", showId);
      if (mounted) {
        const matchedShow = mockShows.find((show) => show.id === showId);
        if (matchedShow) {
          setMatchedShow(matchedShow);
        }
      }
    });

    socketService.onError((message) => {
      console.error("Socket error:", message);
      if (mounted) {
        setIsConnecting(false);
        toast({
          title: "Connection Error",
          description: message,
          variant: "destructive",
        });
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("Index component unmounting, cleaning up");
      mounted = false;
      setIsConnecting(false); // Reset connecting state on unmount
      socketService.disconnect();
      socketService.offRoomJoined(() => {});
      socketService.offUserJoined(() => {});
      socketService.offUserLeft(() => {});
      socketService.offSwipeUpdate(() => {});
      socketService.offMatchFound(() => {});
      socketService.offError(() => {});
    };
  }, [toast]); // Remove room from dependencies to prevent unnecessary re-renders

  const handleJoinRoom = async (roomCode: string, username: string) => {
    try {
      console.log("Starting room join process:", { roomCode, username });
      setIsConnecting(true);

      // Reset any existing room state
      setRoom(null);
      setCurrentUser("");
      setMatchedShow(null);
      setCurrentShowIndex(0);

      await socketService.joinRoom(roomCode, username);
      setCurrentUser(username);

      console.log("Room join successful");
    } catch (error) {
      console.error("Error joining room:", error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to join room. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to let RoomEntry handle the error
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentShow || !room) {
      console.log("Cannot swipe: missing show or room", { currentShow, room });
      return;
    }

    console.log(
      `Processing swipe: ${direction} by ${currentUser} on ${currentShow.title}`
    );
    socketService.swipe(currentShow.id, direction);

    // Move to next show after swipe
    setCurrentShowIndex((prev) => prev + 1);
  };

  const resetApp = () => {
    console.log("Resetting app");
    setCurrentShowIndex(0);
    setRoom(null);
    setCurrentUser("");
    setMatchedShow(null);
  };

  const leaveRoom = () => {
    console.log("Leaving room");
    socketService.leaveRoom();
    setRoom(null);
    setCurrentUser("");
    setMatchedShow(null);
    setCurrentShowIndex(0);
  };

  // Show room entry if not in a room
  if (!room) {
    console.log("Showing room entry screen");
    return (
      <RoomEntry onJoinRoom={handleJoinRoom} isConnecting={isConnecting} />
    );
  }

  // Show match screen if there's a match
  if (matchedShow) {
    console.log("Showing match screen for:", matchedShow.title);
    return <MatchScreen show={matchedShow} onReset={resetApp} />;
  }

  // Show end screen if no more shows
  if (currentShowIndex >= mockShows.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-4">No more shows!</h2>
          <p className="text-xl mb-6">
            You've gone through all available shows without finding a match.
          </p>
          <div className="space-y-3">
            <button
              onClick={resetApp}
              className="block w-full bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={leaveRoom}
              className="block w-full bg-white/20 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/30 transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log(
    "Showing swipe screen for room:",
    room.code,
    "user:",
    currentUser
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <RoomStatus
          roomCode={room.code}
          users={room.users}
          currentUser={currentUser}
        />

        <UserIndicator
          currentUser={currentUser}
          allSwipes={room.swipes}
          roomUsers={room.users}
        />

        <div className="mt-8">
          <SwipeCard
            show={currentShow}
            onSwipe={handleSwipe}
            currentUser={currentUser}
          />
        </div>

        <div className="mt-6 text-center text-white/80">
          <p className="text-sm">
            Show {currentShowIndex + 1} of {mockShows.length}
          </p>
          <button
            onClick={leaveRoom}
            className="text-xs text-white/60 hover:text-white/80 mt-2 underline"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
