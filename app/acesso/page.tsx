"use client";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

export default function AccessPage() {
  const search =
    useSearchParams();

  const router =
    useRouter();

  const motivo =
    search.get("motivo");

  let title =
    "Acesso indisponível";

  let message =
    "Não foi possível liberar seu acesso.";

  if (
    motivo ===
    "aguardando"
  ) {
    title =
      "Aguardando liberação";

    message =
      "Sua conta foi criada com sucesso, mas seu acesso ainda precisa ser liberado.";
  }

  if (
    motivo ===
    "expirado"
  ) {
    title =
      "Sua assinatura expirou";

    message =
      "Renove seu acesso ao BauerDutraFlix para continuar assistindo.";
  }

  if (
    motivo ===
    "sem-perfil"
  ) {
    title =
      "Sua assinatura expirou";

    message =
      "Renove seu acesso ao BauerDutraFlix para continuar assistindo.";
  }

  if (
    motivo ===
    "bloqueado"
  ) {
    title =
      "Conta bloqueada";

    message =
      "Esta conta está bloqueada. Entre em contato para verificar seu acesso.";
  }

  if (
    motivo ===
    "erro"
  ) {
    title =
      "Não foi possível verificar seu acesso";

    message =
      "Ocorreu um problema ao verificar sua assinatura. Tente novamente ou entre em contato.";
  }

  async function logout() {
    const supabase =
      createClient();

    await supabase
      .auth
      .signOut({
        scope:
          "local",
      });

    router.replace(
      "/login"
    );

    router.refresh();
  }

  const whatsappMessage =
    "Olá! Quero renovar meu acesso ao BauerDutraFlix.";

  const whatsappUrl =
    "https://wa.me/5521974252410" +
    `?text=${encodeURIComponent(
      whatsappMessage
    )}`;

  const blockedWhatsappUrl =
    "https://wa.me/5521974252410" +
    `?text=${encodeURIComponent(
      "Olá! Minha conta BauerDutraFlix está bloqueada e gostaria de verificar meu acesso."
    )}`;

  return (
    <main
      className="access-page"
    >
      <section
        className="access-card"
      >
        <div
          className="auth-logo"
        >
          BauerDutra
          <span>
            Flix
          </span>
        </div>

        <div
          className="access-icon"
        >
          🔒
        </div>

        <h1>
          {title}
        </h1>

        <p>
          {message}
        </p>

        {motivo !==
          "bloqueado" && (
          <a
            className="access-whatsapp"
            href={
              whatsappUrl
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Renovar pelo WhatsApp
          </a>
        )}

        {motivo ===
          "bloqueado" && (
          <a
            className="access-whatsapp"
            href={
              blockedWhatsappUrl
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Entrar em contato
          </a>
        )}

        <button
          type="button"
          onClick={
            logout
          }
        >
          Sair da conta
        </button>
      </section>
    </main>
  );
}