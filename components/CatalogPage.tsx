"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  MediaItem,
  Movie,
  TvShow,
} from "@/types/catalog";

import {
  getNowPlaying,
  getOnTheAir,
  getPopularMovies,
  getPopularShows,
  getTopMovies,
  getTopShows,
} from "@/services/tmdb-client";

import {
  getAvailableIds,
} from "@/services/superflix-client";

import LoadingScreen from "./LoadingScreen";
import MediaCard from "./MediaCard";
import CatalogSkeleton from "./CatalogSkeleton";

interface CatalogPageProps {
  type: "filme" | "serie";
}

type MovieOrder =
  | "recentes"
  | "avaliados"
  | "az";

interface MovieGenre {
  id: number;
  label: string;
}

const movieGenres: MovieGenre[] = [
  {
    id: 0,
    label: "Todos",
  },
  {
    id: 28,
    label: "Ação",
  },
  {
    id: 35,
    label: "Comédia",
  },
  {
    id: 27,
    label: "Terror",
  },
  {
    id: 16,
    label: "Animação",
  },
  {
    id: 878,
    label: "Ficção científica",
  },
  {
    id: 18,
    label: "Drama",
  },
];

function unique<T extends {
  id: number;
}>(
  items: T[]
): T[] {
  return Array.from(
    new Map(
      items.map((item) => [
        item.id,
        item,
      ])
    ).values()
  );
}

function getMovieTime(
  movie: Movie
): number {
  if (!movie.release_date) {
    return 0;
  }

  const time = new Date(
    movie.release_date
  ).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

export default function CatalogPage({
  type,
}: CatalogPageProps) {
  const [items, setItems] =
    useState<MediaItem[] | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [
    selectedGenre,
    setSelectedGenre,
  ] = useState(0);

  const [movieOrder, setMovieOrder] =
    useState<MovieOrder>("recentes");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError(null);

        const ids =
          await getAvailableIds(type);

        const lists =
          type === "filme"
            ? await Promise.all([
                getNowPlaying(1),
                getNowPlaying(2),

                getPopularMovies(1),
                getPopularMovies(2),

                getTopMovies(1),
              ])
            : await Promise.all([
                getOnTheAir(1),
                getOnTheAir(2),

                getPopularShows(1),
                getPopularShows(2),

                getTopShows(1),
              ]);

        const merged = unique(
          lists.flat() as (
            | Movie
            | TvShow
          )[]
        ).filter(
          (item) =>
            ids.has(item.id) &&
            Boolean(item.poster_path)
        );

        if (active) {
          setItems(merged);
        }
      } catch (cause) {
        if (!active) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Falha ao carregar o catálogo."
        );
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [type]);

  const visibleItems =
    useMemo(() => {
      if (!items) {
        return [];
      }

      /*
       * A página de séries não recebe
       * nenhum filtro novo.
       */
      if (type === "serie") {
        return items;
      }

      let movies =
        items as Movie[];

      /*
       * Filtra pelo gênero selecionado.
       */
      if (selectedGenre !== 0) {
        movies = movies.filter(
          (movie) =>
            movie.genre_ids?.includes(
              selectedGenre
            )
        );
      }

      /*
       * Cria uma cópia para não alterar
       * a lista original.
       */
      const orderedMovies = [
        ...movies,
      ];

      if (
        movieOrder === "recentes"
      ) {
        orderedMovies.sort(
          (a, b) =>
            getMovieTime(b) -
            getMovieTime(a)
        );
      }

      if (
        movieOrder === "avaliados"
      ) {
        orderedMovies.sort(
          (a, b) =>
            (b.vote_average || 0) -
            (a.vote_average || 0)
        );
      }

      if (movieOrder === "az") {
        orderedMovies.sort(
          (a, b) =>
            a.title.localeCompare(
              b.title,
              "pt-BR"
            )
        );
      }

      return orderedMovies;
    }, [
      items,
      type,
      selectedGenre,
      movieOrder,
    ]);

  if (error) {
    return (
      <section className="status-panel">
        <h1>
          Falha ao carregar
        </h1>

        <p>{error}</p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!items) {
  return (
    <CatalogSkeleton
      title
      rows={3}
      cardsPerRow={7}
    />
  );
}

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <div>
          <span className="catalog-label">
            BauerDutraFlix
          </span>

          <h1>
            {type === "filme"
              ? "Filmes"
              : "Séries"}
          </h1>

          <p>
            {visibleItems.length}{" "}
            {visibleItems.length === 1
              ? "título disponível"
              : "títulos disponíveis"}
          </p>
        </div>

        {type === "filme" && (
          <label className="movie-order">
            <span>
              Ordenar por
            </span>

            <select
              value={movieOrder}
              onChange={(event) =>
                setMovieOrder(
                  event.target
                    .value as MovieOrder
                )
              }
            >
              <option value="recentes">
                Mais recentes
              </option>

              <option value="avaliados">
                Melhor avaliados
              </option>

              <option value="az">
                A–Z
              </option>
            </select>
          </label>
        )}
      </div>

      {type === "filme" && (
        <div className="movie-filters">
          {movieGenres.map(
            (genre) => (
              <button
                key={genre.id}
                type="button"
                className={
                  selectedGenre ===
                  genre.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedGenre(
                    genre.id
                  )
                }
              >
                {genre.label}
              </button>
            )
          )}
        </div>
      )}

      {visibleItems.length === 0 ? (
        <div className="catalog-empty">
          <span>🎬</span>

          <h2>
            Nenhum filme encontrado
          </h2>

          <p>
            Não há títulos deste gênero
            nas listas carregadas.
          </p>

          {type === "filme" &&
            selectedGenre !== 0 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedGenre(0)
                }
              >
                Mostrar todos
              </button>
            )}
        </div>
      ) : (
        <div className="catalog-grid">
          {visibleItems.map(
            (item) => (
              <MediaCard
                key={
                  `${type}-` +
                  item.id
                }
                item={item}
                type={type}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}