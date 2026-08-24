"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MediaItem } from "@/types/catalog";
import {
  searchMulti,
} from "@/services/tmdb-client";
import {
  getAvailableIds,
} from "@/services/superflix-client";
import LoadingScreen from "./LoadingScreen";
import MediaCard from "./MediaCard";

export default function SearchResults() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() || "";
  const [items, setItems] =
    useState<MediaItem[] | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!query) {
        setItems([]);
        return;
      }

      try {
        const [results, movieIds, showIds] =
          await Promise.all([
            searchMulti(query),
            getAvailableIds("filme"),
            getAvailableIds("serie"),
          ]);

        const filtered = results.filter((item) => {
          if (item.media_type === "movie") {
            return movieIds.has(item.id);
          }

          if (item.media_type === "tv") {
            return showIds.has(item.id);
          }

          return false;
        });

        if (active) setItems(filtered);
      } catch (cause) {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível realizar a busca."
        );
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [query]);

  if (error) {
  return (
    <section className="status-panel">
      <h1>
        Não foi possível concluir a busca
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
    return <LoadingScreen message="Pesquisando" />;
  }

  return (
    <section className="catalog-page">
      <h1>
        {query
          ? `Resultados para “${query}”`
          : "Buscar"}
      </h1>

      {query && items.length === 0 && (
        <p className="empty-message">
          Nenhum título disponível foi encontrado.
        </p>
      )}

      <div className="catalog-grid">
        {items.map((item) => (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            type={
              item.media_type === "tv"
                ? "serie"
                : "filme"
            }
          />
        ))}
      </div>
    </section>
  );
}
