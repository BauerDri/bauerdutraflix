"use client";

import {
  useEffect,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

export default function SessionHeartbeat() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  useEffect(() => {
    /*
     * =========================================================
     * ROTAS QUE NÃƒO PRECISAM DE HEARTBEAT
     * =========================================================
     */

    if (
      pathname.startsWith(
        "/login"
      ) ||
      pathname.startsWith(
        "/acesso"
      ) ||
      pathname.startsWith(
        "/redefinir-senha"
      )
    ) {
      return;
    }

    let active =
      true;

    let loggingOut =
      false;

    /*
     * =========================================================
     * HEARTBEAT
     * =========================================================
     */

    async function heartbeat() {
      if (
        !active ||
        loggingOut
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            "/api/session/heartbeat",
            {
              method:
                "POST",

              cache:
                "no-store",

              credentials:
                "include",
            }
          );

        if (
          response.ok ||
          !active
        ) {
          return;
        }

        /*
         * 401 / 403 significa que a sessÃ£o
         * realmente nÃ£o existe mais ou foi
         * derrubada pelo administrador.
         */
        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          loggingOut =
            true;

          const supabase =
            createClient();

          await supabase
            .auth
            .signOut({ scope: "local" });

          if (!active) {
            return;
          }

          router.replace(
            "/login"
          );

          router.refresh();
        }

      } catch (
        error
      ) {
        /*
         * Falha de internet NÃƒO deve
         * deslogar o usuÃ¡rio.
         */
        console.error(
          "[HEARTBEAT]",
          error
        );
      }
    }

    /*
     * Primeira verificaÃ§Ã£o.
     */
    heartbeat();

    /*
     * Verifica a sessÃ£o a cada 30 segundos.
     */
    const timer =
      window.setInterval(
        heartbeat,
        30_000
      );

    /*
     * IMPORTANTE:
     *
     * NÃ£o usamos mais pagehide,
     * beforeunload ou sendBeacon aqui.
     *
     * Fechar/recarregar a pÃ¡gina nÃ£o deve
     * apagar a sessÃ£o acidentalmente.
     *
     * O botÃ£o "Sair" continua chamando
     * /api/session/end normalmente.
     *
     * SessÃµes abandonadas somem pelo
     * timeout de 5 minutos do servidor.
     */

    return () => {
      active =
        false;

      window.clearInterval(
        timer
      );
    };

  }, [
    pathname,
    router,
  ]);

  return null;
}
