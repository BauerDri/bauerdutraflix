export type MediaKind = "filme" | "serie";

export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
  media_type?: "movie";
}

export interface SeasonSummary {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string | null;
  air_date?: string | null;
}

export interface TvShow {
  id: number;
  name: string;
  overview: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
  seasons?: SeasonSummary[];
  media_type?: "tv";
}

export interface Episode {
  id: number;
  name: string;
  overview?: string;
  episode_number: number;
  season_number: number;
  still_path?: string | null;
  air_date?: string | null;
}

export interface SeasonDetails {
  id: number;
  name: string;
  season_number: number;
  episodes: Episode[];
}

export type MediaItem = Movie | TvShow;

export interface TmdbListResponse<T> {
  page: number;
  results: T[];
}
