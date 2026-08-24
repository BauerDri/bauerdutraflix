export type FavoriteType =
  | "filme"
  | "serie";

export interface FavoriteItem {
  id: number;
  type: FavoriteType;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  year?: string;
  score?: number;
}

export interface LastWatchedEpisode {
  showId: number;
  season: number;
  episode: number;
  watchedAt: number;
}