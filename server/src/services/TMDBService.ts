import { Show } from "../types/index.js";

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
    const apiKey = process.env.TMDB_API_KEY;
    console.log(
      "TMDBService: Initializing with API key:",
      apiKey ? "***" + apiKey.slice(-4) : "NOT FOUND"
    );

    if (!apiKey) {
      console.error(
        "TMDBService: CRITICAL ERROR - TMDB API key not found in environment variables"
      );
      console.error(
        "TMDBService: Available environment variables:",
        Object.keys(process.env).filter((key) => key.includes("TMDB"))
      );
      throw new Error(
        "TMDB API key not found in environment variables. Please check your environment configuration."
      );
    }
    this.API_KEY = apiKey;
    console.log("TMDBService: Successfully initialized with API key");
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
      console.log("TMDBService: Using cached data for:", url);
      console.log("TMDBService: Cached data sample:", {
        timestamp: new Date(cached.timestamp).toISOString(),
        dataKeys: Object.keys(cached.data),
        resultsCount: cached.data.results?.length,
        firstResult: cached.data.results?.[0]
          ? {
              id: cached.data.results[0].id,
              title:
                cached.data.results[0].title || cached.data.results[0].name,
            }
          : null,
      });
      return cached.data as T;
    }

    console.log("TMDBService: Fetching fresh data from TMDB API:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("TMDBService: Fresh API response sample:", {
      resultsCount: data.results?.length,
      firstResult: data.results?.[0]
        ? {
            id: data.results[0].id,
            title: data.results[0].title || data.results[0].name,
          }
        : null,
    });

    this.cache.set(url, { data, timestamp: Date.now() });
    console.log("TMDBService: Cached new data for:", url);
    return data as T;
  }

  private convertToShow(data: any): Show {
    console.log("TMDBService: Converting TMDB data to Show:", {
      originalId: data.id,
      originalTitle: data.title || data.name,
      originalOverview: data.overview,
      mediaType: data.media_type,
      rawData: {
        id: data.id,
        title: data.title,
        name: data.name,
        overview: data.overview,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        release_date: data.release_date,
        first_air_date: data.first_air_date,
        vote_average: data.vote_average,
      },
    });

    const convertedShow = {
      id: data.id.toString(),
      title: data.title || data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date || data.first_air_date,
      vote_average: data.vote_average,
      type: data.media_type || (data.title ? "movie" : "tv"),
      streamingService: "netflix",
    };

    console.log("TMDBService: Converted to Show:", {
      finalId: convertedShow.id,
      finalTitle: convertedShow.title,
      finalType: convertedShow.type,
    });

    return convertedShow;
  }

  public async getNetflixContent(
    contentType?: "movies" | "tv"
  ): Promise<Show[]> {
    try {
      console.log(
        `Server: Getting Netflix ${
          contentType || "all content"
        } from server cache...`
      );

      let allShows: Show[] = [];

      if (!contentType || contentType === "movies") {
        // Get movies available on Netflix
        const moviesUrl = `${this.BASE_URL}/discover/movie?api_key=${this.API_KEY}&with_watch_providers=${this.NETFLIX_PROVIDER_ID}&watch_region=US&sort_by=popularity.desc`;
        const moviesData = await this.fetchWithCache<TMDBResponse>(moviesUrl);

        console.log("Server: Raw TMDB API responses:", {
          moviesCount: moviesData.results.length,
          firstMovie: moviesData.results[0]
            ? {
                id: moviesData.results[0].id,
                title: (moviesData.results[0] as TMDBMovie).title,
                overview:
                  (moviesData.results[0] as TMDBMovie).overview?.substring(
                    0,
                    100
                  ) + "...",
              }
            : null,
        });

        allShows.push(...moviesData.results.map(this.convertToShow));
      }

      if (!contentType || contentType === "tv") {
        // Get TV shows available on Netflix
        const tvUrl = `${this.BASE_URL}/discover/tv?api_key=${this.API_KEY}&with_watch_providers=${this.NETFLIX_PROVIDER_ID}&watch_region=US&sort_by=popularity.desc`;
        const tvData = await this.fetchWithCache<TMDBResponse>(tvUrl);

        console.log("Server: Raw TMDB API responses:", {
          tvCount: tvData.results.length,
          firstTV: tvData.results[0]
            ? {
                id: tvData.results[0].id,
                name: (tvData.results[0] as TMDBTVShow).name,
                overview:
                  (tvData.results[0] as TMDBTVShow).overview?.substring(
                    0,
                    100
                  ) + "...",
              }
            : null,
        });

        allShows.push(...tvData.results.map(this.convertToShow));
      }

      // Sort by popularity (rating) and limit to 100 shows
      const sortedShows = allShows
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 100);

      console.log(
        `Server: Retrieved ${sortedShows.length} Netflix ${
          contentType || "shows"
        } (${allShows.length} total)`
      );

      // Log first few shows for debugging
      console.log(
        "Server: First 10 shows:",
        sortedShows.slice(0, 10).map((s) => ({ id: s.id, title: s.title }))
      );

      return sortedShows;
    } catch (error) {
      console.error("Server: Error fetching Netflix content:", error);
      throw error;
    }
  }

  public async getShowDetails(
    showId: string,
    contentType?: "movies" | "tv"
  ): Promise<Show> {
    try {
      // Ensure showId is normalized as string
      const normalizedShowId = String(showId);

      console.log(
        `Server: Fetching show details for ID: ${normalizedShowId} (contentType: ${
          contentType || "auto-detect"
        })`
      );

      let response: Response;
      let data: any;

      if (contentType === "tv") {
        // User selected TV shows, so use TV endpoint
        console.log(
          `Server: Using TV endpoint for show ID: ${normalizedShowId}`
        );
        response = await fetch(
          `${this.BASE_URL}/tv/${normalizedShowId}?api_key=${this.API_KEY}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch TV show details for ID: ${normalizedShowId}`
          );
        }

        data = await response.json();
        data.media_type = "tv";
        console.log(
          `Server: Found TV show with ID: ${data.id}, name: "${data.name}"`
        );
        console.log("Server: Raw TV data:", {
          id: data.id,
          name: data.name,
          overview: data.overview?.substring(0, 100) + "...",
          poster_path: data.poster_path,
          vote_average: data.vote_average,
        });
      } else if (contentType === "movies") {
        // User selected movies, so use movie endpoint
        console.log(
          `Server: Using movie endpoint for show ID: ${normalizedShowId}`
        );
        response = await fetch(
          `${this.BASE_URL}/movie/${normalizedShowId}?api_key=${this.API_KEY}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch movie details for ID: ${normalizedShowId}`
          );
        }

        data = await response.json();
        data.media_type = "movie";
        console.log(
          `Server: Found movie with ID: ${data.id}, title: "${data.title}"`
        );
        console.log("Server: Raw movie data:", {
          id: data.id,
          title: data.title,
          overview: data.overview?.substring(0, 100) + "...",
          poster_path: data.poster_path,
          vote_average: data.vote_average,
        });
      } else {
        // Auto-detect (fallback for backward compatibility)
        console.log(
          `Server: Auto-detecting content type for show ID: ${normalizedShowId}`
        );

        // Try movie endpoint first
        response = await fetch(
          `${this.BASE_URL}/movie/${normalizedShowId}?api_key=${this.API_KEY}`
        );

        if (response.ok) {
          data = await response.json();
          data.media_type = "movie";
          console.log(
            `Server: Found movie with ID: ${data.id}, title: "${data.title}"`
          );
          console.log("Server: Raw movie data:", {
            id: data.id,
            title: data.title,
            overview: data.overview?.substring(0, 100) + "...",
            poster_path: data.poster_path,
            vote_average: data.vote_average,
          });
        } else {
          // If movie not found, try TV show endpoint
          response = await fetch(
            `${this.BASE_URL}/tv/${normalizedShowId}?api_key=${this.API_KEY}`
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch show details for ID: ${normalizedShowId}`
            );
          }

          data = await response.json();
          data.media_type = "tv";
          console.log(
            `Server: Found TV show with ID: ${data.id}, name: "${data.name}"`
          );
          console.log("Server: Raw TV data:", {
            id: data.id,
            name: data.name,
            overview: data.overview?.substring(0, 100) + "...",
            poster_path: data.poster_path,
            vote_average: data.vote_average,
          });
        }
      }

      const convertedShow = this.convertToShow(data);
      console.log(
        `Server: Converted show - ID: ${convertedShow.id}, title: "${convertedShow.title}"`
      );
      return convertedShow;
    } catch (error) {
      console.error("Server: Error fetching show details:", error);
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
      return allShows.sort((a, b) => b.vote_average - a.vote_average);
    } catch (error) {
      console.error("Server: Error searching Netflix content:", error);
      throw error;
    }
  }

  // Method to manually clear cache (useful for testing or admin purposes)
  public clearCache(): void {
    this.cache.clear();
    console.log("Server: TMDB cache cleared");
  }

  // Method to get cache status
  public getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const tmdbService = TMDBService.getInstance();
