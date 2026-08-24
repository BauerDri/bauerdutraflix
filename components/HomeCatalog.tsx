"use client";

import { useEffect, useState } from "react";
import type { Movie, TvShow } from "@/types/catalog";
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
import HeroCarousel from "./HeroCarousel";
import CatalogSkeleton from "./CatalogSkeleton";
import MediaRow from "./MediaRow";


interface HomeData {
  releases: Movie[];
  recentMovies: Movie[];
  popularMovies: Movie[];
  topMovies: Movie[];
  recentShows: TvShow[];
  popularShows: TvShow[];
  topShows: TvShow[];
}

function filterAvailable<T extends {id: number}>(
  items: T[],
  ids: Set<number>
): T[] {
  return items.filter((item) => ids.has(item.id));
}

export default function HomeCatalog() {
  const [data, setData] =
    useState<HomeData | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [
          movieIds,
          showIds,
          nowPlaying,
          popularMovies,
          topMovies,
          onTheAir,
          popularShows,
          topShows,
        ] = await Promise.all([
          getAvailableIds("filme"),
          getAvailableIds("serie"),
          getNowPlaying(1),
          getPopularMovies(1),
          getTopMovies(1),
          getOnTheAir(1),
          getPopularShows(1),
          getTopShows(1),
        ]);

        if (!active) return;

        const recentMovies =
          filterAvailable(nowPlaying, movieIds);

        setData({
          releases: recentMovies
            .filter((movie) => movie.backdrop_path)
            .slice(0, 5),
          recentMovies: recentMovies.slice(0, 20),
          popularMovies:
            filterAvailable(
              popularMovies,
              movieIds
            ).slice(0, 20),
          topMovies:
            filterAvailable(
              topMovies,
              movieIds
            ).slice(0, 20),
          recentShows:
            filterAvailable(
              onTheAir,
              showIds
            ).slice(0, 20),
          popularShows:
            filterAvailable(
              popularShows,
              showIds
            ).slice(0, 20),
          topShows:
            filterAvailable(
              topShows,
              showIds
            ).slice(0, 20),
        });
      } catch (cause) {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar o catálogo."
        );
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <section className="status-panel">
        <h1>Não foi possível carregar</h1>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!data) {
  return (
    <CatalogSkeleton
      title={false}
      rows={5}
      cardsPerRow={7}
    />
  );
}

  return (
    <>
      {data.releases.length > 0 ? (
        <HeroCarousel movies={data.releases} />
      ) : (
        <section className="fallback-hero">
          <span>BauerDutraFlix</span>
          <h1>Seu streaming pessoal</h1>
          <p>
            O catálogo está disponível nos menus
            Filmes e Séries.
          </p>
        </section>
      )}

      <MediaRow
        title="Adicionados recentemente"
        items={data.recentMovies}
        type="filme"
      />
      <MediaRow
        title="Filmes populares"
        items={data.popularMovies}
        type="filme"
      />
      <MediaRow
        title="Filmes mais bem avaliados"
        items={data.topMovies}
        type="filme"
      />
      <MediaRow
        title="Séries com novos episódios"
        items={data.recentShows}
        type="serie"
      />
      <MediaRow
        title="Séries populares"
        items={data.popularShows}
        type="serie"
      />
      <MediaRow
        title="Séries recomendadas"
        items={data.topShows}
        type="serie"
      />
    </>
  );
}
