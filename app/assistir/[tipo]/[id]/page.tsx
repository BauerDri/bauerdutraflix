"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import Navbar from "@/components/Navbar";

import {
  getSeason,
  getShow,
} from "@/services/tmdb-client";

import {
  saveLastWatchedEpisode,
} from "@/lib/user-storage";

interface NextEpisode {
  season: number;
  episode: number;
}

export default function WatchPage() {
  const params = useParams<{
    tipo: string;
    id: string;
  }>();

  const router = useRouter();
  const search = useSearchParams();

  const type =
    params.tipo === "serie"
      ? "serie"
      : "filme";

  const season = Number(
    search.get("temporada") || "1"
  );

  const episode = Number(
    search.get("episodio") || "1"
  );

  const [
    nextEpisode,
    setNextEpisode,
  ] = useState<NextEpisode | null>(
    null
  );

  const [
    loadingNext,
    setLoadingNext,
  ] = useState(
    type === "serie"
  );

  const [
    countdown,
    setCountdown,
  ] = useState<number | null>(
    null
  );

  /*
   * Registra o episódio atual como
   * último assistido.
   */
  useEffect(() => {
    if (type !== "serie") {
      return;
    }

    saveLastWatchedEpisode({
      showId: Number(params.id),
      season:
        Number.isFinite(season)
          ? season
          : 1,
      episode:
        Number.isFinite(episode)
          ? episode
          : 1,
      watchedAt: Date.now(),
    });
  }, [
    type,
    params.id,
    season,
    episode,
  ]);

  /*
   * Descobre qual é o próximo episódio.
   */
  useEffect(() => {
    if (type !== "serie") {
      setLoadingNext(false);
      return;
    }

    let active = true;

    async function findNextEpisode() {
      setLoadingNext(true);
      setNextEpisode(null);
      setCountdown(null);

      try {
        const currentSeason =
          await getSeason(
            params.id,
            season
          );

        if (!active) {
          return;
        }

        const currentIndex =
          currentSeason.episodes.findIndex(
            (item) =>
              item.episode_number ===
              episode
          );

        /*
         * Existe outro episódio dentro
         * da temporada atual.
         */
        const nextInCurrentSeason =
          currentSeason.episodes[
            currentIndex + 1
          ];

        if (nextInCurrentSeason) {
          setNextEpisode({
            season,
            episode:
              nextInCurrentSeason
                .episode_number,
          });

          return;
        }

        /*
         * Se este era o último episódio,
         * procura a próxima temporada.
         */
        const show =
          await getShow(params.id);

        if (!active) {
          return;
        }

        const nextSeason =
          show.seasons
            ?.filter(
              (item) =>
                item.season_number >
                  season &&
                item.episode_count > 0
            )
            .sort(
              (a, b) =>
                a.season_number -
                b.season_number
            )[0];

        if (!nextSeason) {
          setNextEpisode(null);
          return;
        }

        /*
         * Confirma qual é o primeiro episódio
         * disponível da próxima temporada.
         */
        const nextSeasonDetails =
          await getSeason(
            params.id,
            nextSeason.season_number
          );

        if (!active) {
          return;
        }

        const firstEpisode =
          nextSeasonDetails.episodes[0];

        if (!firstEpisode) {
          setNextEpisode(null);
          return;
        }

        setNextEpisode({
          season:
            nextSeason.season_number,

          episode:
            firstEpisode.episode_number,
        });
      } catch (error) {
        console.error(
          "Erro procurando próximo episódio:",
          error
        );

        if (active) {
          setNextEpisode(null);
        }
      } finally {
        if (active) {
          setLoadingNext(false);
        }
      }
    }

    findNextEpisode();

    return () => {
      active = false;
    };
  }, [
    type,
    params.id,
    season,
    episode,
  ]);

  /*
   * Contagem regressiva.
   */
  useEffect(() => {
    if (
      countdown === null ||
      !nextEpisode
    ) {
      return;
    }

    if (countdown <= 0) {
      router.push(
        `/assistir/serie/${params.id}` +
          `?temporada=${nextEpisode.season}` +
          `&episodio=${nextEpisode.episode}`
      );

      return;
    }

    const timer = window.setTimeout(
      () => {
        setCountdown(
          (current) =>
            current === null
              ? null
              : current - 1
        );
      },
      1000
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    countdown,
    nextEpisode,
    params.id,
    router,
  ]);

  const base =
    process.env
      .NEXT_PUBLIC_SUPERFLIX_API ||
    "https://superflixapi.pro";

  const playerUrl =
    type === "serie"
      ? (
          `${base}/serie/` +
          `${params.id}/` +
          `${season}/` +
          `${episode}`
        )
      : `${base}/filme/${params.id}`;

  return (
    <main className="player-page">
      <Navbar />

      <section className="player-shell">
        <iframe
          src={playerUrl}
          title="Player BauerDutraFlix"
          allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *; clipboard-write *; accelerometer *; gyroscope *; web-share *"
          allowFullScreen
        />

        {type === "serie" && (
          <div className="player-episode-controls">
            <div className="current-episode">
              <span>
                Assistindo agora
              </span>

              <strong>
                Temporada {season}
                {" • "}
                Episódio {episode}
              </strong>
            </div>

            <div className="next-episode-actions">
              <Link
                className="back-to-series"
                href={`/serie/${params.id}`}
              >
                Voltar à série
              </Link>

              {countdown !== null ? (
                <>
                  <button
                    type="button"
                    className="next-episode-button counting"
                    disabled
                  >
                    Próximo episódio em{" "}
                    {countdown}s
                  </button>

                  <button
                    type="button"
                    className="cancel-countdown"
                    onClick={() =>
                      setCountdown(null)
                    }
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="next-episode-button"
                  disabled={
                    loadingNext ||
                    !nextEpisode
                  }
                  onClick={() =>
                    setCountdown(5)
                  }
                >
                  {loadingNext
                    ? "Procurando próximo..."
                    : nextEpisode
                      ? (
                          <>
                            Próximo episódio
                            <small>
                              T
                              {
                                nextEpisode.season
                              }
                              {" • "}
                              E
                              {
                                nextEpisode.episode
                              }
                            </small>
                          </>
                        )
                      : "Último episódio disponível"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}