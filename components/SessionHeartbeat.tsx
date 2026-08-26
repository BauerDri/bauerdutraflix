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
         * Sessão inexistente/revogada.
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
            .signOut({
              scope:
                "local",
            });

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
         * Falha de internet não deve
         * derrubar o usuário.
         */
        console.error(
          "[HEARTBEAT]",
          error
        );
      }
    }

    heartbeat();

    const timer =
      window.setInterval(
        heartbeat,
        30_000
      );

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