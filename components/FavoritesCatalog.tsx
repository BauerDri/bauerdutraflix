"use client";

import {
  useEffect,
  useState,
} from "react";

import MediaCard from "./MediaCard";

import {
  getFavorites,
} from "@/lib/user-storage";

import type {
  MediaItem,
  Movie,
  TvShow,
} from "@/types/catalog";

import type {
  FavoriteItem,
} from "@/types/user-data";

function convertFavorite(
  favorite: FavoriteItem
): MediaItem {
  if (
    favorite.type === "serie"
  ) {
    const show: TvShow = {
      id: favorite.id,
      name: favorite.title,
      overview: "",

      first_air_date:
        favorite.year
          ? `${favorite.year}-01-01`
          : undefined,

      poster_path:
        favorite.posterPath,

      backdrop_path:
        favorite.backdropPath,

      vote_average:
        favorite.score,

      media_type: "tv",
    };

    return show;
  }

  const movie: Movie = {
    id: favorite.id,
    title: favorite.title,
    overview: "",

    release_date:
      favorite.year
        ? `${favorite.year}-01-01`
        : undefined,

    poster_path:
      favorite.posterPath,

    backdrop_path:
      favorite.backdropPath,

    vote_average:
      favorite.score,

    media_type: "movie",
  };

  return movie;
}

export default function FavoritesCatalog() {
  const [favorites, setFavorites] =
    useState<FavoriteItem[]>([]);

  useEffect(() => {
    function update() {
      setFavorites(
        getFavorites()
      );
    }

    update();

    window.addEventListener(
      "bauerdutraflix-storage",
      update
    );

    window.addEventListener(
      "storage",
      update
    );

    return () => {
      window.removeEventListener(
        "bauerdutraflix-storage",
        update
      );

      window.removeEventListener(
        "storage",
        update
      );
    };
  }, []);

  return (
    <section className="catalog-page">
      <h1>Favoritos</h1>

      {favorites.length === 0 && (
        <div className="favorites-empty">
          <span>♡</span>

          <h2>
            Nenhum favorito ainda
          </h2>

          <p>
            Clique no coração de um filme
            ou série para adicionar aqui.
          </p>
        </div>
      )}

      <div className="catalog-grid">
        {favorites.map(
          (favorite) => (
            <MediaCard
              key={
                `${favorite.type}-` +
                favorite.id
              }
              item={
                convertFavorite(
                  favorite
                )
              }
              type={favorite.type}
            />
          )
        )}
      </div>
    </section>
  );
}