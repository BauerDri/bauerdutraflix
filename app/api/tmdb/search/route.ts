import {
  NextRequest,
  NextResponse,
} from "next/server";

const TMDB_BASE =
  "https://api.themoviedb.org/3";

export async function GET(
  request: NextRequest
) {
  const query =
    request.nextUrl.searchParams
      .get("q")
      ?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  const apiKey =
    process.env.TMDB_KEY ||
    process.env.NEXT_PUBLIC_TMDB_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Chave do TMDB não configurada.",
      },
      {
        status: 500,
      }
    );
  }

  const url =
    `${TMDB_BASE}/search/multi` +
    `?query=${encodeURIComponent(query)}` +
    `&include_adult=false` +
    `&page=1` +
    `&language=pt-BR` +
    `&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal:
        AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            `TMDB respondeu HTTP ${response.status}.`,
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    const results =
      Array.isArray(data.results)
        ? data.results.filter(
            (item: {
              media_type?: string;
              poster_path?: string | null;
            }) =>
              (
                item.media_type === "movie" ||
                item.media_type === "tv"
              ) &&
              Boolean(item.poster_path)
          )
        : [];

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      "[Busca TMDB]",
      error
    );

    return NextResponse.json(
      {
        error:
          "O TMDB demorou para responder.",
      },
      {
        status: 504,
      }
    );
  }
}