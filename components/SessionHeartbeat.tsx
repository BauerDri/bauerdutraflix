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
     * ROTAS QUE NÃO PRECISAM DE HEARTBEAT
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
         * 401 / 403 significa que a sessão
         * realmente não existe mais ou foi
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
            .signOut();

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
         * Falha de internet NÃO deve
         * deslogar o usuário.
         */
        console.error(
          "[HEARTBEAT]",
          error
        );
      }
    }

    /*
     * Primeira verificação.
     */
    heartbeat();

    /*
     * Verifica a sessão a cada 30 segundos.
     */
    const timer =
      window.setInterval(
        heartbeat,
        30_000
      );

    /*
     * IMPORTANTE:
     *
     * Não usamos mais pagehide,
     * beforeunload ou sendBeacon aqui.
     *
     * Fechar/recarregar a página não deve
     * apagar a sessão acidentalmente.
     *
     * O botão "Sair" continua chamando
     * /api/session/end normalmente.
     *
     * Sessões abandonadas somem pelo
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