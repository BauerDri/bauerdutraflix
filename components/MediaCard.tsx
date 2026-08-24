import Link from "next/link";

import FavoriteButton from "./FavoriteButton";

import type {
  MediaItem,
  Movie,
  TvShow,
} from "@/types/catalog";

interface MediaCardProps {
  item: MediaItem;
  type: "filme" | "serie";
}

export default function MediaCard({
  item,
  type,
}: MediaCardProps) {
  const title =
    type === "filme"
      ? (item as Movie).title
      : (item as TvShow).name;

  const date =
    type === "filme"
      ? (item as Movie).release_date
      : (item as TvShow).first_air_date;

  const year =
    date?.slice(0, 4) || "—";

  const score =
    typeof item.vote_average ===
    "number"
      ? item.vote_average.toFixed(1)
      : null;

  const href =
  type === "filme"
    ? `/filme/${item.id}`
    : `/serie/${item.id}`;

  const favoriteItem = {
    id: item.id,
    type,
    title,

    posterPath:
      item.poster_path,

    backdropPath:
      item.backdrop_path,

    year:
      year === "—"
        ? undefined
        : year,

    score:
      item.vote_average,
  };

  return (
    <article className="media-card">
      <Link href={href}>
        <div className="poster">
          {item.poster_path ? (
            <img
              src={
                `https://image.tmdb.org/t/p/w500` +
                item.poster_path
              }
              alt={`Capa de ${title}`}
              loading="lazy"
            />
          ) : (
            <div className="poster-fallback">
              Sem capa
            </div>
          )}

          <FavoriteButton
            item={favoriteItem}
          />

          <div className="poster-overlay">
            <span>▶</span>
          </div>
        </div>

        <div className="media-info">
          <h3>{title}</h3>

          <div>
            <span>{year}</span>

            {score && (
              <span>★ {score}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}