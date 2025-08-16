import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Show } from "@/types/show";
import {
  Star,
  Clock,
  Calendar,
  Film,
  Tv,
  Users,
  DollarSign,
  Globe,
  Building,
  Loader2,
} from "lucide-react";

interface ShowDetailsModalProps {
  show: Show | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ShowDetailsModal({
  show,
  isOpen,
  onClose,
  isLoading = false,
}: ShowDetailsModalProps) {
  if (!show) return null;

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {show.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
              <p className="text-gray-600">Loading detailed information...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Section with Backdrop */}
            <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden">
              <img
                src={`https://image.tmdb.org/t/p/original${show.backdrop_path}`}
                alt={show.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                {show.tagline && (
                  <p className="text-lg italic opacity-90 mb-2">
                    "{show.tagline}"
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{show.vote_average.toFixed(1)}</span>
                    {show.vote_count && show.vote_count > 0 && (
                      <span className="opacity-70">
                        ({show.vote_count.toLocaleString()})
                      </span>
                    )}
                  </div>
                  {show.type === "movie" && show.runtime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatRuntime(show.runtime)}</span>
                    </div>
                  )}
                  {show.type === "tv" && show.number_of_seasons && (
                    <div className="flex items-center gap-1">
                      <Tv className="w-4 h-4" />
                      <span>
                        {show.number_of_seasons} season
                        {show.number_of_seasons !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Genres */}
            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {show.genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary" className="text-sm">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Overview
              </h3>
              <p className="text-gray-700 leading-relaxed">{show.overview}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Release Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Release Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Release Date:</span>
                      <span className="font-medium">
                        {formatDate(show.release_date)}
                      </span>
                    </div>
                    {show.status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{show.status}</span>
                      </div>
                    )}
                    {show.original_language && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Original Language:
                        </span>
                        <span className="font-medium">
                          {show.original_language.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Production Information */}
                {show.production_companies &&
                  show.production_companies.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Production Companies
                      </h4>
                      <div className="space-y-1">
                        {show.production_companies
                          .slice(0, 3)
                          .map((company) => (
                            <div
                              key={company.id}
                              className="text-sm text-gray-700"
                            >
                              {company.name}
                            </div>
                          ))}
                        {show.production_companies.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{show.production_companies.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Movie-specific details */}
                {show.type === "movie" && (
                  <>
                    {show.budget && show.budget > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Financial Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Budget:</span>
                            <span className="font-medium">
                              {formatCurrency(show.budget)}
                            </span>
                          </div>
                          {show.revenue && show.revenue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Revenue:</span>
                              <span className="font-medium">
                                {formatCurrency(show.revenue)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* TV-specific details */}
                {show.type === "tv" && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                      <Tv className="w-4 h-4" />
                      Series Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      {show.number_of_seasons && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Seasons:</span>
                          <span className="font-medium">
                            {show.number_of_seasons}
                          </span>
                        </div>
                      )}
                      {show.number_of_episodes && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Episodes:</span>
                          <span className="font-medium">
                            {show.number_of_episodes}
                          </span>
                        </div>
                      )}
                      {show.episode_run_time &&
                        show.episode_run_time.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Episode Length:
                            </span>
                            <span className="font-medium">
                              {formatRuntime(show.episode_run_time[0])}
                            </span>
                          </div>
                        )}
                      {show.in_production !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">In Production:</span>
                          <span className="font-medium">
                            {show.in_production ? "Yes" : "No"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {show.spoken_languages && show.spoken_languages.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {show.spoken_languages.map((lang, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {lang.english_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-center pt-4">
              <Button onClick={onClose} className="px-8 py-3">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
