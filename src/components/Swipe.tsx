import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { socketService } from "@/services/socket";
import { Show } from "@/types/show";
import { tmdbService } from "@/services/tmdb";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Match {
  showId: string;
  matchedUsers: string[];
  show?: Show;
}

export default function Swipe() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);

  useEffect(() => {
    const socket = socketService.getSocket();

    const handleMatchFound = async (data: {
      showId: string;
      matchedUsers: string[];
    }) => {
      console.log("Match found!", data);

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
    };

    socket?.on("matchFound", handleMatchFound);

    return () => {
      socket?.off("matchFound", handleMatchFound);
    };
  }, []);

  const handleCloseMatch = () => {
    setIsMatchDialogOpen(false);
    setCurrentMatch(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
      {/* ... existing swipe UI ... */}

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
                <div className="text-4xl font-bold text-green-600 mb-4">
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
                          {currentMatch.show.release_date}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Rating</div>
                        <div className="font-medium">
                          {currentMatch.show.vote_average}/10
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-8 px-8 py-6 text-lg"
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
