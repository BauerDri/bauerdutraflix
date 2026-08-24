import {
  NextRequest,
  NextResponse,
} from "next/server";

const BASE =
  process.env.SUPERFLIX_API ||
  "https://superflixapi.pro";

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

  const url =
    `${BASE}/lista` +
    `?category=${encodeURIComponent(category)}` +
    `&type=tmdb` +
    `&format=json` +
    `&order=desc`;

  try {
    console.log(
      "[SUPERFLIX] Iniciando consulta",
      {
        category,

        /*
         * Não mostramos query secreta.
         * Nesse endpoint não existe token mesmo,
         * então está seguro mostrar a origem.
         */
        base:
          BASE,

        environment:
          process.env.NODE_ENV,
      }
    );

    const startedAt =
      Date.now();

    const response =
      await fetch(
        url,
        {
          /*
           * Durante o diagnóstico,
           * não quero cache escondendo
           * respostas antigas.
           */
          cache:
            "no-store",

          signal:
            AbortSignal.timeout(
              15000
            ),

          headers: {
            Accept:
              "application/json,text/plain,*/*",

            /*
             * Alguns serviços se comportam
             * diferente com User-Agent vazio
             * de servidor.
             */
            "User-Agent":
              "Mozilla/5.0 (compatible; BauerDutraFlix/1.0)",
          },
        }
      );

    const elapsed =
      Date.now() -
      startedAt;

    const contentType =
      response.headers.get(
        "content-type"
      );

    /*
     * Lemos como TEXTO primeiro.
     *
     * Assim conseguimos descobrir se
     * recebemos JSON, HTML, Cloudflare,
     * página de bloqueio etc.
     */
    const raw =
      await response.text();

    console.log(
      "[SUPERFLIX] Resposta recebida",
      {
        category,

        status:
          response.status,

        statusText:
          response.statusText,

        ok:
          response.ok,

        contentType,

        elapsedMs:
          elapsed,

        bodyLength:
          raw.length,

        /*
         * Só um pequeno pedaço para diagnóstico.
         */
        bodyPreview:
          raw
            .slice(
              0,
              300
            )
            .replace(
              /\s+/g,
              " "
            ),
      }
    );

    /*
     * ========================================================
     * SUPERFLIX RESPONDEU ERRO
     * ========================================================
     */

    if (
      !response.ok
    ) {
      console.error(
        "[SUPERFLIX] HTTP ERROR",
        {
          status:
            response.status,

          statusText:
            response.statusText,

          contentType,

          preview:
            raw
              .slice(
                0,
                300
              )
              .replace(
                /\s+/g,
                " "
              ),
        }
      );

      return NextResponse.json(
        {
          error:
            "Erro ao consultar a SuperFlix.",

          diagnostic: {
            status:
              response.status,

            statusText:
              response.statusText,

            contentType,

            /*
             * Temporário.
             *
             * Depois que resolvermos,
             * vamos remover isso.
             */
            preview:
              raw
                .slice(
                  0,
                  150
                )
                .replace(
                  /\s+/g,
                  " "
                ),
          },
        },
        {
          status: 502,
        }
      );
    }

    /*
     * ========================================================
     * TENTA INTERPRETAR JSON
     * ========================================================
     */

    let data:
      unknown;

    try {
      data =
        JSON.parse(
          raw
        );

    } catch (
      parseError
    ) {
      console.error(
        "[SUPERFLIX] JSON inválido",
        {
          contentType,

          error:
            parseError instanceof
            Error
              ? parseError.message
              : String(
                  parseError
                ),

          preview:
            raw
              .slice(
                0,
                500
              )
              .replace(
                /\s+/g,
                " "
              ),
        }
      );

      return NextResponse.json(
        {
          error:
            "A SuperFlix não retornou JSON válido.",

          diagnostic: {
            contentType,

            preview:
              raw
                .slice(
                  0,
                  150
                )
                .replace(
                  /\s+/g,
                  " "
                ),
          },
        },
        {
          status: 502,
        }
      );
    }

    /*
     * ========================================================
     * VALIDA FORMATO
     * ========================================================
     */

    if (
      !Array.isArray(
        data
      )
    ) {
      console.error(
        "[SUPERFLIX] Formato inesperado",
        {
          type:
            typeof data,

          dataPreview:
            JSON
              .stringify(
                data
              )
              .slice(
                0,
                300
              ),
        }
      );

      return NextResponse.json(
        {
          error:
            "Formato inesperado retornado pela SuperFlix.",

          diagnostic: {
            receivedType:
              typeof data,
          },
        },
        {
          status: 502,
        }
      );
    }

    /*
     * ========================================================
     * CONVERTE IDS
     * ========================================================
     */

    const ids =
      data
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

    console.log(
      "[SUPERFLIX] Sucesso",
      {
        category,

        totalReceived:
          data.length,

        totalValidIds:
          ids.length,

        elapsedMs:
          elapsed,
      }
    );

    return NextResponse.json(
      ids,
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );

  } catch (
    error
  ) {
    const message =
      error instanceof
      Error
        ? error.message
        : String(
            error
          );

    const cause =
      error instanceof
        Error &&
      "cause" in error
        ? String(
            error.cause
          )
        : null;

    console.error(
      "[SUPERFLIX] FETCH EXCEPTION",
      {
        category,
        message,
        cause,
      }
    );

    return NextResponse.json(
      {
        error:
          "Falha ao consultar a SuperFlix.",

        diagnostic: {
          message,
          cause,
        },
      },
      {
        status: 504,
      }
    );
  }
}