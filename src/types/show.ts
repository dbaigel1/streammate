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
