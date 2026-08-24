import dotenv from "dotenv";

import {
  createClient,
} from "@supabase/supabase-js";

/*
 * ============================================================
 * CARREGA O .env.local
 * ============================================================
 */

dotenv.config({
  path: ".env.local",
});


const SUPERFLIX_API =
  process.env.SUPERFLIX_API ||
  "https://superflixapi.pro";


const SUPABASE_URL =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;


const SUPABASE_SECRET_KEY =
  process.env
    .SUPABASE_SECRET_KEY;


/*
 * ============================================================
 * VALIDA VARIÁVEIS
 * ============================================================
 */

if (!SUPABASE_URL) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL não encontrada no .env.local."
  );

  process.exit(1);
}


if (!SUPABASE_SECRET_KEY) {
  console.error(
    "❌ SUPABASE_SECRET_KEY não encontrada no .env.local."
  );

  process.exit(1);
}


console.log(
  "✅ Variáveis do Supabase carregadas."
);


/*
 * ============================================================
 * CLIENTE SUPABASE ADMIN
 * ============================================================
 */

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );


/*
 * ============================================================
 * BUSCA IDS NA SUPERFLIX
 * ============================================================
 */

async function fetchIds(
  category
) {
  const url =
    `${SUPERFLIX_API}/lista` +
    `?category=${category}` +
    `&type=tmdb` +
    `&format=json` +
    `&order=desc`;


  console.log(
    `\n🔎 Consultando ${category}...`
  );


  const response =
    await fetch(
      url,
      {
        signal:
          AbortSignal.timeout(
            15000
          ),
      }
    );


  if (!response.ok) {
    throw new Error(
      `SuperFlix respondeu HTTP ${response.status}`
    );
  }


  const data =
    await response.json();


  if (
    !Array.isArray(
      data
    )
  ) {
    throw new Error(
      "A SuperFlix retornou um formato inesperado."
    );
  }


  const ids =
    data
      .map(
        (value) =>
          Number(value)
      )
      .filter(
        Number.isFinite
      );


  console.log(
    `📦 ${ids.length} IDs recebidos.`
  );


  return ids;
}


/*
 * ============================================================
 * SALVA NO SUPABASE
 * ============================================================
 */

async function save(
  category,
  ids
) {
  const {
    error,
  } =
    await supabase
      .from(
        "catalog_cache"
      )
      .upsert(
        {
          category,

          ids,

          updated_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "category",
        }
      );


  if (error) {
    throw new Error(
      `Supabase: ${error.message}`
    );
  }


  console.log(
    `✅ ${category}: ${ids.length} IDs salvos no Supabase.`
  );
}


/*
 * ============================================================
 * SINCRONIZAÇÃO
 * ============================================================
 */

async function sync() {
  console.log(
    "\n=========================================="
  );

  console.log(
    "🎬 BAUERDUTRAFLIX • SYNC SUPERFLIX"
  );

  console.log(
    new Date()
      .toLocaleString(
        "pt-BR"
      )
  );

  console.log(
    "=========================================="
  );


  try {
    const filmes =
      await fetchIds(
        "filme"
      );


    await save(
      "filme",
      filmes
    );

  } catch (
    error
  ) {
    console.error(
      "❌ Erro sincronizando filmes:",
      error instanceof Error
        ? error.message
        : error
    );
  }


  try {
    const series =
      await fetchIds(
        "serie"
      );


    await save(
      "serie",
      series
    );

  } catch (
    error
  ) {
    console.error(
      "❌ Erro sincronizando séries:",
      error instanceof Error
        ? error.message
        : error
    );
  }


  console.log(
    "\n⏳ Próxima atualização em 10 minutos."
  );
}


/*
 * ============================================================
 * PRIMEIRA EXECUÇÃO
 * ============================================================
 */

await sync();


/*
 * ============================================================
 * REPETE A CADA 10 MINUTOS
 * ============================================================
 */

setInterval(
  sync,
  10 * 60 * 1000
);