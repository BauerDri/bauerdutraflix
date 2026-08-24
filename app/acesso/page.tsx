"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

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

  /*
   * Conta criada, mas ainda sem
   * data de liberação.
   */
  if (motivo === "aguardando") {
    title =
      "Aguardando liberação";

    message =
      "Sua conta foi criada com sucesso, mas seu acesso ainda precisa ser liberado.";
  }

  /*
   * Acesso vencido.
   */
  if (motivo === "expirado") {
    title =
      "Sua assinatura expirou";

    message =
      "Renove seu acesso ao BauerDutraFlix para continuar assistindo.";
  }

  /*
   * Por enquanto mostramos a mesma
   * tela de renovação caso exista
   * algum problema ao localizar
   * o perfil.
   *
   * Depois vamos corrigir a causa
   * disso no RLS do Supabase.
   */
  if (motivo === "sem-perfil") {
    title =
      "Sua assinatura expirou";

    message =
      "Renove seu acesso ao BauerDutraFlix para continuar assistindo.";
  }

  /*
   * Conta bloqueada manualmente
   * pelo administrador.
   */
  if (motivo === "bloqueado") {
    title =
      "Conta bloqueada";

    message =
      "Esta conta está bloqueada. Entre em contato para verificar seu acesso.";
  }

  /*
   * Erro inesperado durante a
   * validação server-side.
   */
  if (motivo === "erro") {
    title =
      "Não foi possível verificar seu acesso";

    message =
      "Ocorreu um problema ao verificar sua assinatura. Tente novamente ou entre em contato.";
  }

  async function logout() {
    const supabase =
      createClient();

    await supabase.auth.signOut();

    router.push("/login");

    router.refresh();
  }

  /*
   * Mensagem pronta que será aberta
   * no WhatsApp.
   */
  const whatsappMessage =
    "Olá! Quero renovar meu acesso ao BauerDutraFlix.";

  const whatsappUrl =
    "https://wa.me/5521974252410" +
    `?text=${encodeURIComponent(
      whatsappMessage
    )}`;

  return (
    <main className="access-page">
      <section className="access-card">
        <div className="auth-logo">
          BauerDutra
          <span>Flix</span>
        </div>

        <div className="access-icon">
          🔒
        </div>

        <h1>{title}</h1>

        <p>{message}</p>

        {motivo !== "bloqueado" && (
          <a
            className="access-whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Renovar pelo WhatsApp
          </a>
        )}

        {motivo === "bloqueado" && (
          <a
            className="access-whatsapp"
            href={
              "https://wa.me/5521974252410" +
              `?text=${encodeURIComponent(
                "Olá! Minha conta BauerDutraFlix está bloqueada e gostaria de verificar meu acesso."
              )}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            Entrar em contato
          </a>
        )}

        <button
          type="button"
          onClick={logout}
        >
          Sair da conta
        </button>
      </section>
    </main>
  );
}