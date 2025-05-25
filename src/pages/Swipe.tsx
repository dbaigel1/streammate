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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";

interface LocationState {
  room: Room;
  user: User;
  isHost: boolean;
}

interface Match {
  showId: string;
  matchedUsers: string[];
  show?: Show;
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

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
    });

    socket?.on(
      "matchFound",
      async (data: { showId: string; matchedUsers: string[] }) => {
        console.log("Match found!", data);
        toast.success("It's a match! 🎉", {
          duration: 4000,
          position: "top-center",
          style: {
            background: "#10B981",
            color: "white",
            fontSize: "1.2rem",
            padding: "1rem",
          },
        });

        // Fetch show details for the match
        try {
          const showDetails = await tmdbService.getShowDetails(data.showId);
          const match: Match = {
            ...data,
            show: showDetails,
          };

          setMatches((prev) => [...prev, match]);
          setCurrentMatch(match);
          setIsMatchDialogOpen(true);
        } catch (error) {
          console.error("Error fetching show details for match:", error);
        }
      }
    );

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

  const handleCloseMatch = () => {
    setIsMatchDialogOpen(false);
    setCurrentMatch(null);
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

      {/* Match Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-none">
          {currentMatch?.show && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={handleCloseMatch}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex flex-col items-center text-center p-6">
                <div className="text-4xl font-bold text-green-600 mb-4 animate-bounce">
                  It's a Match! 🎉
                </div>

                <div className="text-xl mb-6">
                  You and {currentMatch.matchedUsers.length - 1} other user
                  {currentMatch.matchedUsers.length > 2 ? "s" : ""} matched on:
                </div>

                <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="relative aspect-[16/9] w-full">
                    <img
                      src={`https://image.tmdb.org/t/p/original${currentMatch.show.backdrop_path}`}
                      alt={currentMatch.show.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h2 className="text-3xl font-bold mb-2">
                        {currentMatch.show.title}
                      </h2>
                      <p className="text-lg opacity-90">
                        {currentMatch.show.overview}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-sm text-gray-500">
                          Release Date
                        </div>
                        <div className="font-medium">
                          {new Date(
                            currentMatch.show.release_date
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Rating</div>
                        <div className="font-medium">
                          {currentMatch.show.vote_average.toFixed(1)}/10
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-8 px-8 py-6 text-lg bg-green-600 hover:bg-green-700"
                  onClick={handleCloseMatch}
                >
                  Continue Swiping
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Matches History */}
      {matches.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-md">
          <h3 className="text-lg font-semibold mb-2">Your Matches</h3>
          <div className="space-y-2">
            {matches.map((match, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">
                  {match.show?.title || "Loading..."}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
