import dotenv from "dotenv";

import {
  createClient,
} from "@supabase/supabase-js";

dotenv.config({
  path: ".env.local",
});


/* ============================================================
   CONFIGURAÇÃO
   ============================================================ */

const SUPERFLIX_API =
  process.env.SUPERFLIX_API ||
  "https://superflixapi.pro";

const SUPABASE_URL =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SECRET_KEY =
  process.env
    .SUPABASE_SECRET_KEY;

const TMDB_KEY =
  process.env.TMDB_KEY ||
  process.env.NEXT_PUBLIC_TMDB_KEY;


/* ============================================================
   VALIDAÇÃO
   ============================================================ */

if (!SUPABASE_URL) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL não encontrada."
  );

  process.exit(1);
}

if (!SUPABASE_SECRET_KEY) {
  console.error(
    "❌ SUPABASE_SECRET_KEY não encontrada."
  );

  process.exit(1);
}

if (!TMDB_KEY) {
  console.warn(
    "⚠️ TMDB_KEY não encontrada. Novidades serão mostradas apenas pelo ID."
  );
}


/* ============================================================
   SUPABASE
   ============================================================ */

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );


/* ============================================================
   UTILIDADES
   ============================================================ */

function formatNumber(value) {
  return new Intl
    .NumberFormat(
      "pt-BR"
    )
    .format(
      value
    );
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}


/* ============================================================
   LÊ CATÁLOGO ATUAL
   ============================================================ */

async function getCurrentIds(
  category
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "catalog_cache"
      )
      .select("ids")
      .eq(
        "category",
        category
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Erro lendo catálogo atual: ${error.message}`
    );
  }

  if (
    !data ||
    !Array.isArray(
      data.ids
    )
  ) {
    return [];
  }

  return data.ids
    .map(
      (value) =>
        Number(value)
    )
    .filter(
      Number.isFinite
    );
}


/* ============================================================
   CONSULTA SUPERFLIX
   ============================================================ */

async function fetchSuperflixIds(
  category
) {
  const url =
    `${SUPERFLIX_API}/lista` +
    `?category=${category}` +
    `&type=tmdb` +
    `&format=json` +
    `&order=desc`;

  console.log(
    "🔎 Consultando SuperFlix..."
  );

  const response =
    await fetch(
      url,
      {
        signal:
          AbortSignal.timeout(
            20000
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
      "Resposta inesperada da SuperFlix."
    );
  }

  return data
    .map(
      (value) =>
        Number(value)
    )
    .filter(
      Number.isFinite
    );
}


/* ============================================================
   COMPARAÇÃO
   ============================================================ */

function findNewIds(
  oldIds,
  newIds
) {
  const oldSet =
    new Set(
      oldIds
    );

  return newIds.filter(
    (id) =>
      !oldSet.has(
        id
      )
  );
}

function findRemovedIds(
  oldIds,
  newIds
) {
  const newSet =
    new Set(
      newIds
    );

  return oldIds.filter(
    (id) =>
      !newSet.has(
        id
      )
  );
}


/* ============================================================
   TMDB - NOME DOS TÍTULOS
   ============================================================ */

async function getTmdbTitle(
  category,
  id
) {
  if (!TMDB_KEY) {
    return null;
  }

  const tmdbType =
    category === "filme"
      ? "movie"
      : "tv";

  const url =
    `https://api.themoviedb.org/3/${tmdbType}/${id}` +
    `?api_key=${encodeURIComponent(TMDbKeySafe())}` +
    `&language=pt-BR`;

  try {
    const response =
      await fetch(
        url,
        {
          signal:
            AbortSignal.timeout(
              10000
            ),
        }
      );

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    return (
      data.title ||
      data.name ||
      data.original_title ||
      data.original_name ||
      null
    );

  } catch {
    return null;
  }
}

function TMDbKeySafe() {
  return TMDB_KEY;
}


/* ============================================================
   MOSTRA NOVIDADES
   ============================================================ */

async function printNewItems(
  category,
  ids
) {
  if (
    ids.length ===
    0
  ) {
    console.log(
      "✨ Nenhuma novidade desde a última sincronização."
    );

    return;
  }

  console.log(
    `\n🆕 ${ids.length} ${
      category === "filme"
        ? ids.length === 1
          ? "filme novo"
          : "filmes novos"
        : ids.length === 1
          ? "série nova"
          : "séries novas"
    }:`
  );

  for (
    let index = 0;
    index < ids.length;
    index++
  ) {
    const id =
      ids[index];

    const title =
      await getTmdbTitle(
        category,
        id
      );

    console.log(
      `   + ${id}${
        title
          ? ` • ${title}`
          : ""
      }`
    );

    if (
      index <
      ids.length - 1
    ) {
      await sleep(
        80
      );
    }
  }
}


/* ============================================================
   SALVA CATÁLOGO
   ============================================================ */

async function saveCatalog(
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
}


/* ============================================================
   SINCRONIZA UMA CATEGORIA
   ============================================================ */

async function syncCategory(
  category
) {
  const label =
    category === "filme"
      ? "🎬 FILMES"
      : "📺 SÉRIES";

  console.log(
    "\n------------------------------------------"
  );

  console.log(
    label
  );

  console.log(
    "------------------------------------------"
  );

  const oldIds =
    await getCurrentIds(
      category
    );

  console.log(
    `💾 Salvos anteriormente: ${formatNumber(
      oldIds.length
    )}`
  );

  const newIds =
    await fetchSuperflixIds(
      category
    );

  console.log(
    `📦 Catálogo atual: ${formatNumber(
      newIds.length
    )}`
  );

  const added =
    findNewIds(
      oldIds,
      newIds
    );

  const removed =
    findRemovedIds(
      oldIds,
      newIds
    );

  await printNewItems(
    category,
    added
  );

  if (
    removed.length >
    0
  ) {
    console.log(
      `\n🗑️ ${removed.length} ${
        removed.length === 1
          ? "título saiu"
          : "títulos saíram"
      } do catálogo.`
    );
  }

  await saveCatalog(
    category,
    newIds
  );

  console.log(
    `\n✅ ${
      category === "filme"
        ? "Filmes"
        : "Séries"
    } atualizado no Supabase.`
  );

  return {
    success: true,
    total:
      newIds.length,
    added:
      added.length,
    removed:
      removed.length,
  };
}


/* ============================================================
   SINCRONIZAÇÃO COMPLETA
   ============================================================ */

async function sync() {
  console.log(
    "\n=========================================="
  );

  console.log(
    "🎬 BAUERDUTRAFLIX • ATUALIZAÇÃO DE CATÁLOGO"
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

  let hadError =
    false;

  let movieResult = {
    success: false,
    total: 0,
    added: 0,
    removed: 0,
  };

  let seriesResult = {
    success: false,
    total: 0,
    added: 0,
    removed: 0,
  };


  try {
    movieResult =
      await syncCategory(
        "filme"
      );

  } catch (
    error
  ) {
    hadError =
      true;

    console.error(
      "\n❌ Erro em filmes:",
      error instanceof Error
        ? error.message
        : error
    );
  }


  try {
    seriesResult =
      await syncCategory(
        "serie"
      );

  } catch (
    error
  ) {
    hadError =
      true;

    console.error(
      "\n❌ Erro em séries:",
      error instanceof Error
        ? error.message
        : error
    );
  }


  const totalAdded =
    movieResult.added +
    seriesResult.added;

  const totalRemoved =
    movieResult.removed +
    seriesResult.removed;


  console.log(
    "\n=========================================="
  );

  console.log(
    "📊 RESUMO"
  );

  console.log(
    "=========================================="
  );

  if (
    movieResult.success
  ) {
    console.log(
      `🎬 Filmes: ${formatNumber(
        movieResult.total
      )}`
    );
  } else {
    console.log(
      "🎬 Filmes: ERRO"
    );
  }

  if (
    seriesResult.success
  ) {
    console.log(
      `📺 Séries: ${formatNumber(
        seriesResult.total
      )}`
    );
  } else {
    console.log(
      "📺 Séries: ERRO"
    );
  }

  console.log(
    `🆕 Novidades: ${formatNumber(
      totalAdded
    )}`
  );

  console.log(
    `🗑️ Removidos: ${formatNumber(
      totalRemoved
    )}`
  );


  if (
    totalAdded ===
      0 &&
    !hadError
  ) {
    console.log(
      "✨ Catálogo já estava totalmente atualizado."
    );
  }


  if (
    hadError
  ) {
    console.log(
      "\n❌ Sincronização concluída COM ERROS."
    );

    process.exitCode =
      1;

    return;
  }


  console.log(
    "\n✅ Sincronização concluída com sucesso."
  );

  process.exitCode =
    0;
}


/* ============================================================
   EXECUTA E ENCERRA
   ============================================================ */

await sync();