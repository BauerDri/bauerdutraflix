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
     * Login e telas públicas
     * não precisam de heartbeat.
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

    /*
     * =========================================================
     * HEARTBEAT
     * =========================================================
     */

    async function heartbeat() {
      try {
        const response =
          await fetch(
            "/api/session/heartbeat",
            {
              method:
                "POST",

              cache:
                "no-store",
            }
          );

        if (
          response.ok ||
          !active
        ) {
          return;
        }

        /*
         * Sessão revogada,
         * inexistente ou encerrada.
         */
        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          active =
            false;

          const supabase =
            createClient();

          await supabase
            .auth
            .signOut();

          router.replace(
            "/login"
          );

          router.refresh();
        }

      } catch (
        error
      ) {
        /*
         * Não derruba o usuário
         * somente porque a conexão
         * caiu momentaneamente.
         */
        console.error(
          "[HEARTBEAT]",
          error
        );
      }
    }

    /*
     * =========================================================
     * TENTA LIBERAR A TELA AO FECHAR
     * =========================================================
     */

    function endSession() {
      /*
       * sendBeacon é próprio para
       * chamadas feitas quando a
       * página está sendo fechada.
       */
      try {
        navigator.sendBeacon(
          "/api/session/end"
        );
      } catch {
        /*
         * Se falhar, o timeout do
         * servidor continua sendo
         * nosso plano B.
         */
      }
    }

    /*
     * Primeira checagem.
     */
    heartbeat();

    /*
     * Depois a cada 30 segundos.
     */
    const timer =
      window.setInterval(
        heartbeat,
        30_000
      );

    /*
     * pagehide costuma funcionar
     * melhor que beforeunload em
     * celulares.
     */
    window.addEventListener(
      "pagehide",
      endSession
    );

    window.addEventListener(
      "beforeunload",
      endSession
    );

    return () => {
      active =
        false;

      window.clearInterval(
        timer
      );

      window.removeEventListener(
        "pagehide",
        endSession
      );

      window.removeEventListener(
        "beforeunload",
        endSession
      );
    };

  }, [
    pathname,
    router,
  ]);

  return null;
}