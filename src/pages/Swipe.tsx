import React, { useState, useEffect } from "react";
import { Room, User } from "../../server/src/types/index.js";
import { Show } from "@/types/show";
import { socketService } from "@/services/socket";
import ShowCard from "@/components/ShowCard";
import UserIndicator from "@/components/UserIndicator";
import RoomStatus from "@/components/RoomStatus";
import StreamingPlatforms from "@/components/StreamingPlatforms";
import ContentTypeIndicator from "@/components/ContentTypeIndicator";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useToast } from "@/components/ui/use-toast";

interface SwipeProps {
  room: Room;
  user: User;
  onLeaveRoom: () => void;
}

interface Match {
  showId: string;
  matchedUsers: string[];
  show?: Show;
}

export default function Swipe({ room, user, onLeaveRoom }: SwipeProps) {
  const { toast } = useToast();

  const [shows, setShows] = useState<Show[]>([]);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isLoadingShows, setIsLoadingShows] = useState(false);
  const [roomUsers, setRoomUsers] = useState<User[]>(room.users);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isMatchesExpanded, setIsMatchesExpanded] = useState(false); // Start collapsed on mobile

  useEffect(() => {
    // Log initial room users state
    console.log(
      "Initial room users:",
      roomUsers.map((u) => ({ id: u.id, username: u.username }))
    );
    console.log("Current user:", { id: user.id, username: user.username });
  }, []);

  useEffect(() => {
    // Join the room via socket
    const joinRoom = async () => {
      try {
        await socketService.joinRoom(
          room.code,
          user.username,
          room.contentType
        );
        console.log("Successfully joined room:", room.code);
      } catch (error) {
        console.error("Failed to join room:", error);
        toast({
          title: "Error",
          description: "Failed to join room. Please try again.",
          variant: "destructive",
        });
        // navigate("/"); // Removed navigate
      }
    };

    joinRoom();

    // Load shows when component mounts
    loadShows();

    // Socket event listeners
    const socket = socketService.getSocket();

    socket?.on("userJoined", (newUser: User) => {
      console.log("User joined event received:", newUser);
      setRoomUsers((prev) => {
        // Check if user already exists to prevent duplicates
        if (prev.some((u) => u.id === newUser.id)) {
          console.log(
            "User already exists in room, not adding duplicate:",
            newUser.username,
            "Current users:",
            prev.map((u) => ({ id: u.id, username: u.username }))
          );
          return prev;
        }
        console.log(
          "Adding new user to room:",
          newUser.username,
          "Total users now:",
          prev.length + 1
        );
        return [...prev, newUser];
      });
    });

    socket?.on("userLeft", (userId: string) => {
      console.log("User left event received for userId:", userId);
      setRoomUsers((prev) => {
        const userToRemove = prev.find((u) => u.id === userId);
        if (userToRemove) {
          console.log(
            "Removing user from room:",
            userToRemove.username,
            "Total users now:",
            prev.length - 1
          );
        } else {
          console.log("User not found in room for removal:", userId);
        }
        return prev.filter((u) => u.id !== userId);
      });
    });

    socket?.on("swipeUpdate", (swipeData) => {
      console.log("Swipe update:", swipeData);
    });

    socket?.on(
      "matchFound",
      async (data: { showId: string; matchedUsers: string[] }) => {
        // Ensure showId is normalized as string
        const normalizedShowId = String(data.showId);

        console.log("Client: Match found!", {
          receivedShowId: data.showId,
          receivedShowIdType: typeof data.showId,
          normalizedShowId: normalizedShowId,
          matchedUsers: data.matchedUsers,
        });

        toast({
          title: "It's a match! 🎉",
          description: "You and your friends matched on this show!",
        });

        // Fetch show details for the match
        try {
          console.log(
            "Client: About to fetch show details for match ID:",
            normalizedShowId
          );
          const showDetails = await socketService.getShowDetails(
            normalizedShowId,
            room.contentType
          );
          console.log("Client: Received show details:", {
            id: showDetails.id,
            title: showDetails.title,
            originalRequestedId: normalizedShowId,
          });

          const match: Match = {
            showId: normalizedShowId,
            matchedUsers: data.matchedUsers,
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
  }, [room.code, user.username, room.contentType, toast]); // Removed navigate from dependency array

  const loadShows = async () => {
    setIsLoadingShows(true);
    try {
      console.log("Client: Initializing synchronized room shows...");
      const roomShows = await socketService.initializeRoomShows();
      console.log("Client: Received synchronized shows from server:", {
        totalShows: roomShows.length,
        firstFewShows: roomShows
          .slice(0, 5)
          .map((s) => ({ id: s.id, title: s.title })),
        lastFewShows: roomShows
          .slice(-5)
          .map((s) => ({ id: s.id, title: s.title })),
      });

      setShows(roomShows);
      setCurrentShowIndex(0);
    } catch (error) {
      console.error("Error loading synchronized shows:", error);
      // Fallback to individual loading if room sync fails
      try {
        console.log("Client: Falling back to individual show loading...");
        const netflixShows = await socketService.getNetflixContent();
        setShows(netflixShows);
        setCurrentShowIndex(0);
      } catch (fallbackError) {
        console.error("Fallback loading also failed:", fallbackError);
      }
    } finally {
      setIsLoadingShows(false);
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (isSwiping) return;

    setIsSwiping(true);
    const currentShow = shows[currentShowIndex];

    // Ensure showId is a string for consistent handling
    const normalizedShowId = String(currentShow.id);

    console.log("Client: Swiping on show:", {
      currentShowIndex: currentShowIndex,
      totalShows: shows.length,
      showId: normalizedShowId,
      showIdType: typeof normalizedShowId,
      title: currentShow.title,
      direction,
      allShowIds: shows.slice(0, 10).map((s) => ({ id: s.id, title: s.title })),
    });

    // Emit swipe event with normalized showId
    socketService.swipe(normalizedShowId, direction);

    // Move to next show after a short delay
    setTimeout(() => {
      setCurrentShowIndex((prev) => prev + 1);
      setIsSwiping(false);
    }, 300);
  };

  const handleLeaveRoom = () => {
    socketService.leaveRoom();
    onLeaveRoom(); // Call the prop function to clear room state
  };

  const handleCloseMatch = () => {
    setIsMatchDialogOpen(false);
    setCurrentMatch(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div className="flex items-center gap-4">
          <RoomStatus room={{ ...room, users: roomUsers }} currentUser={user} />
          <ContentTypeIndicator contentType={room.contentType || "tv"} />
        </div>
        <Button
          variant="outline"
          onClick={handleLeaveRoom}
          className="w-full sm:w-auto"
        >
          Leave Room
        </Button>
      </div>

      {/* Users Section */}
      <div className="mb-4 sm:mb-6">
        <UserIndicator users={roomUsers} currentUser={user} />
      </div>

      {/* Streaming Platforms Section */}
      <div className="mb-6 sm:mb-8">
        <StreamingPlatforms />
      </div>

      <div className="relative min-h-[500px] sm:min-h-[600px] mb-4">
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
            roomContentType={room.contentType || "tv"}
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
      <Dialog
        open={isMatchDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseMatch();
          }
        }}
      >
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-none">
          {currentMatch?.show && (
            <div className="relative">
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

      {/* Matches History - Mobile Friendly */}
      {matches.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
          {/* Collapsible Matches Panel */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
            {/* Header with collapse/expand toggle */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 rounded-t-lg border-b border-gray-200"
              onClick={() => setIsMatchesExpanded(!isMatchesExpanded)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Matches ({matches.length})
                </h3>
                {!isMatchesExpanded && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {matches.length} new
                  </div>
                )}
              </div>
              <div className="text-gray-500">
                {isMatchesExpanded ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Expandable Content */}
            {isMatchesExpanded && (
              <div className="p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 rounded bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {match.show?.title || "Loading..."}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
