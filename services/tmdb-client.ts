import type {
  MediaItem,
  Movie,
  SeasonDetails,
  TmdbListResponse,
  TvShow,
} from "@/types/catalog";

const BASE =
  "https://api.themoviedb.org/3";

/*
 * Cache durante a sessão atual.
 *
 * Evita consultar novamente a mesma URL quando
 * você volta para uma página já visitada.
 */
const memoryCache =
  new Map<string, unknown>();

function getKey(): string {
  const key =
    process.env.NEXT_PUBLIC_TMDB_KEY;

  if (
    !key ||
    key === "COLE_SUA_CHAVE_TMDB_AQUI"
  ) {
    throw new Error(
      "Configure NEXT_PUBLIC_TMDB_KEY no arquivo .env.local."
    );
  }

  return key;
}

function criarUrl(path: string): string {
  const separator =
    path.includes("?") ? "&" : "?";

  return (
    `${BASE}${path}${separator}` +
    `api_key=${encodeURIComponent(getKey())}` +
    `&language=pt-BR`
  );
}

function esperar(tempo: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, tempo);
  });
}

async function executarRequest<T>(
  url: string,
  timeoutMs: number
): Promise<T> {
  const controller =
    new AbortController();

  const timer = window.setTimeout(() => {
    controller.abort(
      new DOMException(
        "A consulta ao TMDB demorou demais.",
        "TimeoutError"
      )
    );
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,

      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `TMDB respondeu HTTP ${response.status}.`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        "O TMDB demorou para responder."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Erro de conexão com o TMDB."
    );
  } finally {
    window.clearTimeout(timer);
  }
}

async function request<T>(
  path: string
): Promise<T> {
  const url = criarUrl(path);

  /*
   * Se já buscamos essa URL durante a sessão,
   * devolvemos imediatamente.
   */
  if (memoryCache.has(url)) {
    return memoryCache.get(url) as T;
  }

  let ultimoErro: unknown;

  /*
   * Duas tentativas:
   * 1ª tentativa normal;
   * 2ª após uma pequena pausa.
   */
  for (
    let tentativa = 1;
    tentativa <= 2;
    tentativa++
  ) {
    try {
      const data =
        await executarRequest<T>(
          url,
          30000
        );

      memoryCache.set(url, data);

      return data;
    } catch (error) {
      ultimoErro = error;

      if (tentativa < 2) {
        await esperar(1200);
      }
    }
  }

  if (ultimoErro instanceof Error) {
    throw ultimoErro;
  }

  throw new Error(
    "Não foi possível consultar o TMDB."
  );
}

async function list<T>(
  path: string
): Promise<T[]> {
  const data =
    await request<TmdbListResponse<T>>(
      path
    );

  return data.results;
}

export const getNowPlaying = (
  page = 1
) =>
  list<Movie>(
    `/movie/now_playing?page=${page}&region=BR`
  );

export const getPopularMovies = (
  page = 1
) =>
  list<Movie>(
    `/movie/popular?page=${page}&region=BR`
  );

export const getTopMovies = (
  page = 1
) =>
  list<Movie>(
    `/movie/top_rated?page=${page}&region=BR`
  );

export const getOnTheAir = (
  page = 1
) =>
  list<TvShow>(
    `/tv/on_the_air?page=${page}`
  );

export const getPopularShows = (
  page = 1
) =>
  list<TvShow>(
    `/tv/popular?page=${page}`
  );

export const getTopShows = (
  page = 1
) =>
  list<TvShow>(
    `/tv/top_rated?page=${page}`
  );

export async function searchMulti(
  query: string
): Promise<MediaItem[]> {
  const controller =
    new AbortController();

  const timer =
    window.setTimeout(() => {
      controller.abort();
    }, 35000);

  try {
    const response = await fetch(
      `/api/tmdb/search?q=${encodeURIComponent(
        query
      )}`,
      {
        signal: controller.signal,
      }
    );

    const data: unknown =
      await response.json();

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : "Não foi possível realizar a busca.";

      throw new Error(message);
    }

    return Array.isArray(data)
      ? (data as MediaItem[])
      : [];
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        "A busca demorou demais para responder."
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Erro de conexão durante a busca."
    );
  } finally {
    window.clearTimeout(timer);
  }
}

export const getShow = (
  id: string
) =>
  request<TvShow>(
    `/tv/${id}`
  );

export const getSeason = (
  id: string,
  season: number
) =>
  request<SeasonDetails>(
    `/tv/${id}/season/${season}`
  );
  
  export const getMovie = (
  id: string
) =>
  request<Movie>(
    `/movie/${id}`
  );