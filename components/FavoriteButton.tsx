"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  isFavorite,
  toggleFavorite,
} from "@/lib/user-storage";

import type {
  FavoriteItem,
} from "@/types/user-data";

interface FavoriteButtonProps {
  item: FavoriteItem;
}

export default function FavoriteButton({
  item,
}: FavoriteButtonProps) {
  const [favorite, setFavorite] =
    useState(false);

  useEffect(() => {
    function update() {
      setFavorite(
        isFavorite(
          item.id,
          item.type
        )
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
  }, [item.id, item.type]);

  return (
    <button
      type="button"
      className={
        favorite
          ? "favorite-button active"
          : "favorite-button"
      }
      title={
        favorite
          ? "Remover dos favoritos"
          : "Adicionar aos favoritos"
      }
      aria-label={
        favorite
          ? "Remover dos favoritos"
          : "Adicionar aos favoritos"
      }
      onClick={(event) => {
        /*
         * Impede o clique de abrir o filme
         * ou a série.
         */
        event.preventDefault();
        event.stopPropagation();

        const newState =
          toggleFavorite(item);

        setFavorite(newState);
      }}
    >
      {favorite ? "♥" : "♡"}
    </button>
  );
}