import { User } from "../../server/src/types/index.js";

export interface Show {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  releaseDate: string;
  rating: number;
  type: "movie" | "tv";
  streamingService: "netflix";
}

export interface SwipeData {
  showId: string;
  direction: "left" | "right";
  user: string;
  timestamp: Date;
}

export interface Room {
  id: string;
  code: string;
  users: User[];
  swipes: SwipeData[];
  createdAt: Date;
}
