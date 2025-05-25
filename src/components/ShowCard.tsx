import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Show } from "../types/show";
import { Star, Calendar, Film, Tv } from "lucide-react";

interface ShowCardProps {
  show: Show;
  onSwipe: (direction: "left" | "right") => void;
  isSwiping: boolean;
}

const ShowCard: React.FC<ShowCardProps> = ({ show, onSwipe, isSwiping }) => {
  const handleSwipe = (direction: "left" | "right") => {
    if (!isSwiping) {
      onSwipe(direction);
    }
  };

  return (
    <Card
      className={`relative w-full max-w-md mx-auto bg-white shadow-xl transition-transform duration-200 ${
        isSwiping ? "scale-95" : "scale-100"
      }`}
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

        <div className="flex justify-center space-x-4 pt-4">
          <button
            onClick={() => handleSwipe("left")}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSwiping}
          >
            <svg
              className="w-8 h-8"
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
            onClick={() => handleSwipe("right")}
            className="p-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSwiping}
          >
            <svg
              className="w-8 h-8"
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
  );
};

export default ShowCard;
