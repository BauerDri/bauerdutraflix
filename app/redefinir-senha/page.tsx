"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router =
    useRouter();

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  async function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      password.length <
      6
    ) {
      setError(
        "A nova senha precisa ter pelo menos 6 caracteres."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "As senhas não coincidem."
      );

      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const {
        error:
          updateError,
      } =
        await supabase
          .auth
          .updateUser({
            password,
          });

      if (
        updateError
      ) {
        setError(
          updateError.message
        );

        return;
      }

      setSuccess(
        "Senha alterada com sucesso."
      );

      window.setTimeout(
        () => {
          router.replace(
            "/login"
          );
        },
        1500
      );

    } catch {
      setError(
        "Não foi possível atualizar sua senha."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="auth-page"
    >
      <div
        className="auth-glow auth-glow-one"
      />

      <div
        className="auth-glow auth-glow-two"
      />

      <section
        className="auth-card"
      >
        <div
          className="auth-logo"
        >
          BauerDutra
          <span>
            Flix
          </span>
        </div>

        <p
          className="auth-subtitle"
        >
          Escolha sua nova senha
        </p>

        <form
          onSubmit={
            submit
          }
          className="auth-form"
        >
          <label>
            Nova senha

            <input
              type="password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event
                    .target
                    .value
                )
              }
              placeholder="••••••••"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirmar nova senha

            <input
              type="password"
              value={
                confirmPassword
              }
              onChange={(
                event
              ) =>
                setConfirmPassword(
                  event
                    .target
                    .value
                )
              }
              placeholder="••••••••"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </label>

          {error && (
            <div
              className="auth-error"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="auth-success"
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              loading
            }
          >
            {loading
              ? "Salvando..."
              : "Alterar senha"}
          </button>
        </form>
      </section>
    </main>
  );
}