"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import type {
  Movie,
} from "@/types/catalog";

import {
  getMovie,
} from "@/services/tmdb-client";

import FavoriteButton from "./FavoriteButton";
import MovieDetailsSkeleton from "./MovieDetailsSkeleton";

interface MovieDetailsProps {
  id: string;
}

export default function MovieDetails({
  id,
}: MovieDetailsProps) {
  const [movie, setMovie] =
    useState<Movie | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMovie(id)
      .then((data) => {
        if (active) {
          setMovie(data);
        }
      })
      .catch((cause) => {
        if (!active) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Filme não encontrado."
        );
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <section className="status-panel">
        <h1>
          Não foi possível abrir o filme
        </h1>

        <p>{error}</p>
      </section>
    );
  }

  if (!movie) {
  return <MovieDetailsSkeleton />;
}

  const year =
    movie.release_date
      ?.slice(0, 4) ||
    "—";

  const score =
    typeof movie.vote_average ===
    "number"
      ? movie.vote_average.toFixed(1)
      : "—";

  const favoriteItem = {
    id: movie.id,
    type: "filme" as const,
    title: movie.title,

    posterPath:
      movie.poster_path,

    backdropPath:
      movie.backdrop_path,

    year:
      year === "—"
        ? undefined
        : year,

    score:
      movie.vote_average,
  };

  return (
    <section
      className="movie-details"
      style={{
        backgroundImage:
          movie.backdrop_path
            ? (
                `url("https://image.tmdb.org/t/p/original` +
                `${movie.backdrop_path}")`
              )
            : undefined,
      }}
    >
      <div className="movie-details-overlay" />

      <div className="movie-details-content">
        <div className="movie-poster-large">
          {movie.poster_path ? (
            <img
              src={
                `https://image.tmdb.org/t/p/w500` +
                movie.poster_path
              }
              alt={`Capa de ${movie.title}`}
            />
          ) : (
            <div>
              Sem capa
            </div>
          )}
        </div>

        <div className="movie-details-copy">
          <span className="hero-label">
            Filme
          </span>

          <h1>{movie.title}</h1>

          <div className="hero-meta">
            <span>{year}</span>

            <span>
              ★ {score}
            </span>
          </div>

          <p>
            {movie.overview ||
              "Descrição indisponível."}
          </p>

          <div className="movie-actions">
            <Link
              className="primary-button"
              href={
                `/assistir/filme/${movie.id}`
              }
            >
              ▶ Assistir
            </Link>

            <FavoriteButton
              item={favoriteItem}
            />
          </div>
        </div>
      </div>
    </section>
  );
}