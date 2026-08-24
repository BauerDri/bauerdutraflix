import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest
) {
  const category =
    request.nextUrl
      .searchParams
      .get("category");

  if (
    category !== "filme" &&
    category !== "serie"
  ) {
    return NextResponse.json(
      {
        error:
          "Categoria inválida.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const supabase =
      await createClient();

    const {
      data,
      error,
    } =
      await supabase
        .from("catalog_cache")
        .select(
          "ids,updated_at"
        )
        .eq(
          "category",
          category
        )
        .maybeSingle();

    if (error) {
      console.error(
        "[CATALOG CACHE]",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar o catálogo.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !data ||
      !Array.isArray(
        data.ids
      )
    ) {
      return NextResponse.json(
        [],
        {
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const ids =
      data.ids
        .map(
          (
            value
          ) =>
            Number(
              value
            )
        )
        .filter(
          Number.isFinite
        );

    return NextResponse.json(
      ids,
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=3600",

          "X-Catalog-Updated-At":
            data.updated_at ||
            "",
        },
      }
    );

  } catch (
    error
  ) {
    console.error(
      "[CATALOG CACHE]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno do catálogo.",
      },
      {
        status: 500,
      }
    );
  }
}