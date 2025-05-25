import { Show } from "../types/show";

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  media_type: "movie";
}

interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  media_type: "tv";
}

type TMDBResponse = {
  results: (TMDBMovie | TMDBTVShow)[];
};

export class TMDBService {
  private static instance: TMDBService;
  private readonly API_KEY: string;
  private readonly BASE_URL = "https://api.themoviedb.org/3";
  private readonly NETFLIX_PROVIDER_ID = 8; // Netflix's ID in TMDB
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  private constructor() {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) {
      throw new Error("TMDB API key not found in environment variables");
    }
    this.API_KEY = apiKey;
  }

  public static getInstance(): TMDBService {
    if (!TMDBService.instance) {
      TMDBService.instance = new TMDBService();
    }
    return TMDBService.instance;
  }

  private async fetchWithCache<T>(url: string): Promise<T> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(url, { data, timestamp: Date.now() });
    return data as T;
  }

  private convertToShow(data: any): Show {
    return {
      id: data.id.toString(),
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date,
      vote_average: data.vote_average,
      streamingService: "netflix", // Default for now
    };
  }

  public async getNetflixContent(): Promise<Show[]> {
    try {
      // Get movies available on Netflix
      const moviesUrl = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&with_watch_providers=${this.NETFLIX_PROVIDER_ID}&watch_region=US&sort_by=popularity.desc`;
      const moviesData = await this.fetchWithCache<TMDBResponse>(moviesUrl);

      // Get TV shows available on Netflix
      const tvUrl = `${this.BASE_URL}/discover/tv?api_key=${this.API_KEY}&with_watch_providers=${this.NETFLIX_PROVIDER_ID}&watch_region=US&sort_by=popularity.desc`;
      const tvData = await this.fetchWithCache<TMDBResponse>(tvUrl);

      // Combine and convert results
      const allShows = [
        ...moviesData.results.map(this.convertToShow),
        ...tvData.results.map(this.convertToShow),
      ];

      // Sort by popularity (rating) and limit to 100 shows
      return allShows.sort((a, b) => b.rating - a.rating).slice(0, 100);
    } catch (error) {
      console.error("Error fetching Netflix content:", error);
      throw error;
    }
  }

  public async searchNetflixContent(query: string): Promise<Show[]> {
    try {
      // Search movies
      const moviesUrl = `${this.BASE_URL}/search/movie?api_key=${
        this.API_KEY
      }&query=${encodeURIComponent(query)}&with_watch_providers=${
        this.NETFLIX_PROVIDER_ID
      }&watch_region=US`;
      const moviesData = await this.fetchWithCache<TMDBResponse>(moviesUrl);

      // Search TV shows
      const tvUrl = `${this.BASE_URL}/search/tv?api_key=${
        this.API_KEY
      }&query=${encodeURIComponent(query)}&with_watch_providers=${
        this.NETFLIX_PROVIDER_ID
      }&watch_region=US`;
      const tvData = await this.fetchWithCache<TMDBResponse>(tvUrl);

      // Combine and convert results
      const allShows = [
        ...moviesData.results.map(this.convertToShow),
        ...tvData.results.map(this.convertToShow),
      ];

      // Sort by popularity (rating)
      return allShows.sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error("Error searching Netflix content:", error);
      throw error;
    }
  }

  async getShowDetails(showId: string): Promise<Show> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/movie/${showId}?api_key=${this.API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch show details");
      }

      const data = await response.json();
      return this.convertToShow(data);
    } catch (error) {
      console.error("Error fetching show details:", error);
      throw error;
    }
  }

  async searchShows(query: string): Promise<Show[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/search/movie?api_key=${
          this.API_KEY
        }&query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch shows");
      }

      const data = await response.json();
      return data.results.map((result: any) => this.convertToShow(result));
    } catch (error) {
      console.error("Error searching shows:", error);
      throw error;
    }
  }

  async getPopularShows(): Promise<Show[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/movie/popular?api_key=${this.API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch popular shows");
      }

      const data = await response.json();
      return data.results.map((result: any) => this.convertToShow(result));
    } catch (error) {
      console.error("Error fetching popular shows:", error);
      throw error;
    }
  }
}

export const tmdbService = TMDBService.getInstance();
