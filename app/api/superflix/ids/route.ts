import { NextRequest, NextResponse } from "next/server";

const BASE =
  process.env.SUPERFLIX_API ||
  "https://superflixapi.pro";

export async function GET(request: NextRequest) {
  const category =
    request.nextUrl.searchParams.get("category");

  if (category !== "filme" && category !== "serie") {
    return NextResponse.json(
      {error: "Categoria inválida."},
      {status: 400}
    );
  }

  try {
    const response = await fetch(
      `${BASE}/lista?category=${category}&type=tmdb&format=json&order=desc`,
      {
        next: {revalidate: 600},
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {error: "Erro ao consultar a SuperFlix."},
        {status: 502}
      );
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(
      data
        .map((value) => Number(value))
        .filter(Number.isFinite),
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {error: "Timeout da SuperFlix."},
      {status: 504}
    );
  }
}
