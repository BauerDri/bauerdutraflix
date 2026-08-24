"use client";

import Link from "next/link";
import SeriesDetailsSkeleton from "./SeriesDetailsSkeleton";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  LastWatchedEpisode,
} from "@/types/user-data";

import type {
  SeasonDetails,
  TvShow,
} from "@/types/catalog";

import {
  getSeason,
  getShow,
} from "@/services/tmdb-client";

import {
  getLastWatchedEpisode,
} from "@/lib/user-storage";



interface SeriesDetailsProps {
  id: string;
}

export default function SeriesDetails({
  id,
}: SeriesDetailsProps) {
  const [show, setShow] =
    useState<TvShow | null>(null);

  const [
    seasonNumber,
    setSeasonNumber,
  ] = useState<number | null>(
    null
  );

  const [season, setSeason] =
    useState<SeasonDetails | null>(
      null
    );

  const [
    lastWatched,
    setLastWatched,
  ] = useState<
    LastWatchedEpisode | null
  >(null);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Lê o último episódio salvo.
   */
  useEffect(() => {
    function updateLastWatched() {
      setLastWatched(
        getLastWatchedEpisode(
          Number(id)
        )
      );
    }

    updateLastWatched();

    window.addEventListener(
      "bauerdutraflix-storage",
      updateLastWatched
    );

    window.addEventListener(
      "storage",
      updateLastWatched
    );

    window.addEventListener(
      "focus",
      updateLastWatched
    );

    return () => {
      window.removeEventListener(
        "bauerdutraflix-storage",
        updateLastWatched
      );

      window.removeEventListener(
        "storage",
        updateLastWatched
      );

      window.removeEventListener(
        "focus",
        updateLastWatched
      );
    };
  }, [id]);

  /*
   * Carrega os detalhes da série.
   */
  useEffect(() => {
    let active = true;

    getShow(id)
      .then((data) => {
        if (!active) {
          return;
        }

        setShow(data);

        const saved =
          getLastWatchedEpisode(
            Number(id)
          );

        /*
         * Se já existe último episódio,
         * abrimos automaticamente essa temporada.
         */
        if (saved) {
          setSeasonNumber(
            saved.season
          );

          return;
        }

        const firstSeason =
          data.seasons?.find(
            (item) =>
              item.season_number > 0 &&
              item.episode_count > 0
          )?.season_number || 1;

        setSeasonNumber(
          firstSeason
        );
      })
      .catch((cause) => {
        if (!active) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Série não encontrada."
        );
      });

    return () => {
      active = false;
    };
  }, [id]);

  /*
   * Carrega os episódios da temporada.
   */
  useEffect(() => {
    if (
      seasonNumber === null
    ) {
      return;
    }

    let active = true;

    setSeason(null);

    getSeason(
      id,
      seasonNumber
    )
      .then((data) => {
        if (active) {
          setSeason(data);
        }
      })
      .catch((cause) => {
        if (!active) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Temporada indisponível."
        );
      });

    return () => {
      active = false;
    };
  }, [id, seasonNumber]);

  const validSeasons =
    useMemo(
      () =>
        show?.seasons?.filter(
          (item) =>
            item.season_number > 0 &&
            item.episode_count > 0
        ) || [],
      [show]
    );

  if (error) {
    return (
      <section className="status-panel">
        <h1>
          Não foi possível abrir a série
        </h1>

        <p>{error}</p>
      </section>
    );
  }

  if (
  !show ||
  seasonNumber === null
) {
  return <SeriesDetailsSkeleton />;
}

  return (
    <>
      <section
        className="series-hero"
        style={{
          backgroundImage:
            show.backdrop_path
              ? (
                  `url("https://image.tmdb.org/t/p/original` +
                  `${show.backdrop_path}")`
                )
              : undefined,
        }}
      >
        <div className="series-overlay" />

        <div className="series-content">
          <h1>{show.name}</h1>

          <p>
            {show.overview ||
              "Descrição indisponível."}
          </p>

          <div className="hero-meta">
            <span>
              {show.first_air_date
                ?.slice(0, 4) ||
                "Série"}
            </span>

            <span>
              ★{" "}
              {show.vote_average
                ?.toFixed(1) ||
                "—"}
            </span>

            <span>
              {validSeasons.length}{" "}
              temporadas
            </span>
          </div>

          {lastWatched && (
            <div className="last-watched">
              <div>
                <span>
                  Último assistido
                </span>

                <strong>
                  Temporada{" "}
                  {lastWatched.season}
                  {" • "}
                  Episódio{" "}
                  {lastWatched.episode}
                </strong>
              </div>

              <Link
                href={
                  `/assistir/serie/${id}` +
                  `?temporada=${lastWatched.season}` +
                  `&episodio=${lastWatched.episode}`
                }
              >
                ▶ Assistir novamente
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="episodes-section">
        <div className="season-tabs">
          {validSeasons.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={
                  item.season_number ===
                  seasonNumber
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSeasonNumber(
                    item.season_number
                  )
                }
              >
                Temporada{" "}
                {item.season_number}
              </button>
            )
          )}
        </div>

        <h2>
          Temporada {seasonNumber}
        </h2>

        {!season ? (
  <div className="episode-inline-skeletons">
    {Array.from({ length: 5 }).map(
      (_, index) => (
        <div
          className="episode-skeleton-card"
          key={index}
        >
          <div className="episode-image-skeleton" />

          <div className="episode-copy-skeleton">
            <div className="skeleton-text-line" />
            <div className="skeleton-text-line" />
            <div className="skeleton-text-line short" />
          </div>
        </div>
      )
    )}
  </div>
) : (
          <div className="episode-list">
            {season.episodes.map(
              (episode) => {
                const isLastWatched =
                  lastWatched &&
                  lastWatched.season ===
                    seasonNumber &&
                  lastWatched.episode ===
                    episode.episode_number;

                return (
                  <Link
                    className={
                      isLastWatched
                        ? "episode-card last-episode"
                        : "episode-card"
                    }
                    key={episode.id}
                    href={
                      `/assistir/serie/${id}` +
                      `?temporada=${seasonNumber}` +
                      `&episodio=${episode.episode_number}`
                    }
                  >
                    <div className="episode-image">
                      {episode.still_path ? (
                        <img
                          src={
                            `https://image.tmdb.org/t/p/w500` +
                            episode.still_path
                          }
                          alt={episode.name}
                          loading="lazy"
                        />
                      ) : (
                        <div>▶</div>
                      )}

                      <span>▶</span>
                    </div>

                    <div className="episode-copy">
                      <div>
                        <strong>
                          {episode.episode_number}
                          .{" "}
                          {episode.name}
                        </strong>

                        <small>
                          {episode.air_date ||
                            ""}
                        </small>
                      </div>

                      {isLastWatched && (
                        <span className="last-episode-label">
                          Último assistido
                        </span>
                      )}

                      <p>
                        {episode.overview ||
                          "Descrição indisponível."}
                      </p>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </section>
    </>
  );
}