"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { useEffect, useState } from "react";
import type { Movie } from "@/types/catalog";

interface Props {
  movies: Movie[];
}

export default function HeroCarousel({
  movies,
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (movies.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex(
        (current) => (current + 1) % movies.length
      );
    }, 8000);

    return () => window.clearInterval(timer);
  }, [movies.length]);

  if (!movies.length) return null;

  const movie = movies[index];
  const year =
    movie.release_date?.slice(0, 4) || "Novo";
  const score =
    typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : null;

  return (
    <section className="hero">
      <AnimatePresence initial={false}>
        <motion.div
          key={movie.id}
          className="hero-background"
          initial={{opacity: 0, scale: 1.03}}
          animate={{opacity: 1, scale: 1.08}}
          exit={{opacity: 0}}
          transition={{
            opacity: {duration: 0.7},
            scale: {duration: 8, ease: "linear"},
          }}
          style={{
            backgroundImage: movie.backdrop_path
              ? `url("https://image.tmdb.org/t/p/original${movie.backdrop_path}")`
              : undefined,
          }}
        />
      </AnimatePresence>

      <div className="hero-overlay" />

      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${movie.id}`}
          className="hero-content"
          initial={{opacity: 0, y: 24}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -14}}
          transition={{duration: 0.45}}
        >
          <span className="hero-label">
            Lançamento
          </span>
          <h1>{movie.title}</h1>

          <div className="hero-meta">
            <span>{year}</span>
            {score && <span>★ {score}</span>}
          </div>

          <p>
            {movie.overview ||
              "Novo título disponível no BauerDutraFlix."}
          </p>

          <Link
            className="primary-button"
            href={`/filme/${movie.id}`}
          >
            ▶ Assistir
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="hero-dots">
        {movies.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Mostrar ${item.title}`}
            className={
              itemIndex === index ? "active" : ""
            }
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </section>
  );
}
