import { User } from "../../server/src/types/index.js";

export interface Show {
  id: string;
  title: string;
  year: number;
  type: "movie" | "tv";
  genre: string[];
  rating: number;
  description: string;
  poster: string;
}

export interface SwipeData {
  showId: string;
  direction: "left" | "right";
  user: string;
}

export interface Room {
  code: string;
  users: User[];
  swipes: SwipeData[];
}
