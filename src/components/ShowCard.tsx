import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Show } from "../types/show";
import { Star, Calendar, Film, Tv, Info, Loader2 } from "lucide-react";
import ShowDetailsModal from "./ShowDetailsModal";
import { socketService } from "../services/socket";

interface ShowCardProps {
  show: Show;
  onSwipe: (direction: "left" | "right") => void;
  isSwiping: boolean;
  roomContentType: "movies" | "tv";
}

const ShowCard: React.FC<ShowCardProps> = ({
  show,
  onSwipe,
  isSwiping,
  roomContentType,
}) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailedShow, setDetailedShow] = useState<Show | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Clear detailed show data when the show prop changes
  useEffect(() => {
    setDetailedShow(null);
    setIsDetailsModalOpen(false);
  }, [show.id]);

  const handleSwipe = (direction: "left" | "right") => {
    if (!isSwiping) {
      onSwipe(direction);
    }
  };

  const handleCardClick = async () => {
    setIsDetailsModalOpen(true);

    // Fetch detailed show information if we don't have it yet
    if (!detailedShow && !isLoadingDetails) {
      setIsLoadingDetails(true);
      try {
        const detailed = await socketService.getDetailedShowInfo(
          show.id,
          roomContentType
        );
        setDetailedShow(detailed);
      } catch (error) {
        console.error("Failed to fetch detailed show info:", error);
        // Fall back to using the basic show info
        setDetailedShow(show);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  return (
    <>
      <Card
        className={`relative w-full max-w-md mx-auto bg-white shadow-xl transition-transform duration-200 cursor-pointer hover:shadow-2xl ${
          isSwiping ? "scale-95" : "scale-100"
        }`}
        onClick={handleCardClick}
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
          {show.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
              alt={show.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Info button overlay */}
          <div className="absolute top-3 right-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
              {isLoadingDetails ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Info className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{show.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(show.release_date).getFullYear()}
                </span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  {show.vote_average.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 line-clamp-3">{show.overview}</p>

          {/* Genres preview */}
          {show.genres && show.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {show.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.id}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {genre.name}
                </span>
              ))}
              {show.genres.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{show.genres.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSwipe("left");
              }}
              className="p-4 sm:p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-w-[64px] min-h-[64px] flex items-center justify-center"
              disabled={isSwiping}
              aria-label="Swipe left (dislike)"
            >
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSwipe("right");
              }}
              className="p-4 sm:p-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-w-[64px] min-h-[64px] flex items-center justify-center"
              disabled={isSwiping}
              aria-label="Swipe right (like)"
            >
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Show Details Modal */}
      <ShowDetailsModal
        show={detailedShow || show}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        isLoading={isLoadingDetails}
      />
    </>
  );
};

export default ShowCard;
