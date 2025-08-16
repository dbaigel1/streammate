import { User } from "../../server/src/types/index.js";

export interface Show {
  id: string;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  streamingService: string;
  // Additional detailed fields
  genres?: Array<{ id: number; name: string }>;
  runtime?: number; // in minutes
  status?: string; // "Released", "In Production", etc.
  tagline?: string;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  spoken_languages?: Array<{ english_name: string; iso_639_1: string }>;
  budget?: number; // for movies
  revenue?: number; // for movies
  episode_run_time?: number[]; // for TV shows
  number_of_seasons?: number; // for TV shows
  number_of_episodes?: number; // for TV shows
  first_air_date?: string; // for TV shows
  last_air_date?: string; // for TV shows
  in_production?: boolean; // for TV shows
  type?: "movie" | "tv";
}

export interface SwipeData {
  showId: string;
  direction: "left" | "right";
  userId: string;
  timestamp: Date;
}

export interface Room {
  id: string;
  code: string;
  users: User[];
  swipes: SwipeData[];
  matches: {
    showId: string;
    users: string[];
    timestamp: string;
  }[];
  contentType: "movies" | "tv";
  createdAt: Date;
}
