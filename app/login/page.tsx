"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

const REMEMBER_EMAIL_KEY =
  "bauerdutraflix:remembered-email";

export default function LoginPage() {
  const router =
    useRouter();

  const [
    mode,
    setMode,
  ] =
    useState<
      "login" |
      "register"
    >("login");

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    rememberEmail,
    setRememberEmail,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const remembered =
      window
        .localStorage
        .getItem(
          REMEMBER_EMAIL_KEY
        );

    if (remembered) {
      setEmail(
        remembered
      );
    }
  }, []);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    setError("");

    setMessage("");

    const supabase =
      createClient();

    try {
      /*
       * =====================================================
       * CADASTRO
       * =====================================================
       */

      if (
        mode ===
        "register"
      ) {
        if (
          password.length <
          6
        ) {
          setError(
            "A senha precisa ter pelo menos 6 caracteres."
          );

          return;
        }

        const {
          error:
            signUpError,
        } =
          await supabase
            .auth
            .signUp({
              email,
              password,

              options: {
                data: {
                  name:
                    name.trim(),
                },
              },
            });

        if (
          signUpError
        ) {
          setError(
            signUpError.message
          );

          return;
        }

        if (
          rememberEmail
        ) {
          window
            .localStorage
            .setItem(
              REMEMBER_EMAIL_KEY,
              email.trim()
            );
        }

        setMessage(
          "Conta criada com sucesso. FaÃ§a login para continuar."
        );

        setMode(
          "login"
        );

        setPassword("");

        return;
      }

      /*
       * =====================================================
       * LOGIN
       * =====================================================
       */

      const {
        error:
          loginError,
      } =
        await supabase
          .auth
          .signInWithPassword({
            email,
            password,
          });

      if (
        loginError
      ) {
        setError(
          "E-mail ou senha incorretos."
        );

        return;
      }

      /*
       * =====================================================
       * CRIA SESSÃƒO DE TELA
       * =====================================================
       */

      const sessionResponse =
        await fetch(
          "/api/session/start",
          {
            method:
              "POST",

            cache:
              "no-store",
          }
        );

      const sessionData =
        await sessionResponse
          .json();

      if (
        !sessionResponse.ok
      ) {
        await supabase
          .auth
          .signOut({ scope: "local" });

        if (
          sessionData.reason ===
          "screen_limit"
        ) {
          setError(
            `Limite de telas atingido. Este plano permite ${sessionData.max_screens} ${
              sessionData.max_screens ===
              1
                ? "tela"
                : "telas"
            } simultÃ¢neas.`
          );

          return;
        }

        if (
          sessionData.reason ===
          "expired"
        ) {
          router.replace(
            "/acesso?motivo=expirado"
          );

          return;
        }

        if (
          sessionData.reason ===
          "blocked"
        ) {
          router.replace(
            "/acesso?motivo=bloqueado"
          );

          return;
        }

        setError(
          "NÃ£o foi possÃ­vel iniciar sua sessÃ£o."
        );

        return;
      }

      if (
        rememberEmail
      ) {
        window
          .localStorage
          .setItem(
            REMEMBER_EMAIL_KEY,
            email.trim()
          );
      } else {
        window
          .localStorage
          .removeItem(
            REMEMBER_EMAIL_KEY
          );
      }

      router.push("/");

      router.refresh();

    } catch (
      loginException
    ) {
      console.error(
        "[LOGIN]",
        loginException
      );

      setError(
        "NÃ£o foi possÃ­vel concluir a operaÃ§Ã£o."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  async function forgotPassword() {
    const value =
      email.trim();

    setError("");
    setMessage("");

    if (!value) {
      setError(
        "Digite seu e-mail primeiro."
      );

      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const {
        error:
          resetError,
      } =
        await supabase
          .auth
          .resetPasswordForEmail(
            value,
            {
              redirectTo:
                `${window.location.origin}/redefinir-senha`,
            }
          );

      if (
        resetError
      ) {
        setError(
          resetError.message
        );

        return;
      }

      setMessage(
        "Se esse e-mail estiver cadastrado, vocÃª receberÃ¡ um link para redefinir sua senha."
      );

    } catch {
      setError(
        "NÃ£o foi possÃ­vel solicitar a redefiniÃ§Ã£o de senha."
      );

    } finally {
      setLoading(false);
    }
  }

  function changeMode(
    newMode:
      | "login"
      | "register"
  ) {
    setMode(
      newMode
    );

    setError("");

    setMessage("");
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
          {mode ===
          "login"
            ? "Entre para continuar assistindo"
            : "Crie sua conta"}
        </p>

        <div
          className="auth-tabs"
        >
          <button
            type="button"
            className={
              mode ===
              "login"
                ? "active"
                : ""
            }
            onClick={() =>
              changeMode(
                "login"
              )
            }
          >
            Entrar
          </button>

          <button
            type="button"
            className={
              mode ===
              "register"
                ? "active"
                : ""
            }
            onClick={() =>
              changeMode(
                "register"
              )
            }
          >
            Cadastrar
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="auth-form"
        >
          {mode ===
            "register" && (
            <label>
              Nome

              <input
                type="text"
                value={name}
                onChange={(
                  event
                ) =>
                  setName(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Seu nome"
                required
                autoComplete="name"
              />
            </label>
          )}

          <label>
            E-mail

            <input
              type="email"
              value={email}
              onChange={(
                event
              ) =>
                setEmail(
                  event
                    .target
                    .value
                )
              }
              placeholder="seu@email.com"
              required
              autoComplete="username"
            />
          </label>

          <label>
            Senha

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
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              required
              minLength={6}
              autoComplete={
                mode ===
                "login"
                  ? "current-password"
                  : "new-password"
              }
            />
          </label>

          {mode ===
            "login" && (
            <>
              <div
                className="auth-login-options"
              >
                <label
                  className="auth-remember"
                >
                  <input
                    type="checkbox"
                    checked={
                      rememberEmail
                    }
                    onChange={(
                      event
                    ) =>
                      setRememberEmail(
                        event
                          .target
                          .checked
                      )
                    }
                  />

                  <span>
                    Lembrar meu e-mail
                  </span>
                </label>

                <button
                  type="button"
                  className="auth-forgot"
                  onClick={
                    forgotPassword
                  }
                  disabled={
                    loading
                  }
                >
                  Esqueci minha senha
                </button>
              </div>
            </>
          )}

          {error && (
            <div
              className="auth-error"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="auth-success"
            >
              {message}
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
              ? "Aguarde..."
              : mode ===
                  "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        <p
          className="auth-footer"
        >
          {mode ===
          "login"
            ? "Acesso exclusivo para usuÃ¡rios autorizados."
            : "ApÃ³s o cadastro, seu acesso deverÃ¡ ser liberado."}
        </p>
      </section>
    </main>
  );
}
