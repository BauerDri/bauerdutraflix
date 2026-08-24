import {
    type NextRequest,
  } from "next/server";
  
  import {
    updateSession,
  } from "@/lib/supabase/proxy";
  
  export async function proxy(
    request: NextRequest
  ) {
    return await updateSession(
      request
    );
  }
  
  export const config = {
    matcher: [
      /*
       * Roda em todas as páginas e APIs,
       * exceto arquivos estáticos do Next.
       */
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
  };