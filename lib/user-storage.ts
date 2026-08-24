import type {
  FavoriteItem,
  FavoriteType,
  LastWatchedEpisode,
} from "@/types/user-data";

const FAVORITES_KEY =
  "bauerdutraflix:favorites";

const LAST_WATCHED_KEY =
  "bauerdutraflix:last-watched";

function readArray<T>(
  key: string
): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value =
      window.localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? (parsed as T[])
      : [];
  } catch {
    return [];
  }
}

function saveArray<T>(
  key: string,
  items: T[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    key,
    JSON.stringify(items)
  );

  /*
   * Permite que componentes abertos na mesma
   * página sejam atualizados imediatamente.
   */
  window.dispatchEvent(
    new CustomEvent(
      "bauerdutraflix-storage"
    )
  );
}

/* FAVORITOS */

export function getFavorites():
  FavoriteItem[] {
  return readArray<FavoriteItem>(
    FAVORITES_KEY
  );
}

export function isFavorite(
  id: number,
  type: FavoriteType
): boolean {
  return getFavorites().some(
    (item) =>
      item.id === id &&
      item.type === type
  );
}

export function toggleFavorite(
  item: FavoriteItem
): boolean {
  const favorites = getFavorites();

  const exists = favorites.some(
    (saved) =>
      saved.id === item.id &&
      saved.type === item.type
  );

  if (exists) {
    const updated = favorites.filter(
      (saved) =>
        !(
          saved.id === item.id &&
          saved.type === item.type
        )
    );

    saveArray(
      FAVORITES_KEY,
      updated
    );

    return false;
  }

  saveArray(
    FAVORITES_KEY,
    [item, ...favorites]
  );

  return true;
}

/* ÚLTIMO EPISÓDIO ASSISTIDO */

export function saveLastWatchedEpisode(
  item: LastWatchedEpisode
): void {
  const history =
    readArray<LastWatchedEpisode>(
      LAST_WATCHED_KEY
    );

  /*
   * Mantemos somente um registro por série.
   */
  const withoutCurrentShow =
    history.filter(
      (saved) =>
        saved.showId !== item.showId
    );

  saveArray(
    LAST_WATCHED_KEY,
    [
      item,
      ...withoutCurrentShow,
    ]
  );
}

export function getLastWatchedEpisode(
  showId: number
): LastWatchedEpisode | null {
  const history =
    readArray<LastWatchedEpisode>(
      LAST_WATCHED_KEY
    );

  return (
    history.find(
      (item) =>
        item.showId === showId
    ) || null
  );
}