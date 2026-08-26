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
      window.localStorage.getItem(
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
              email:
                email.trim(),

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
          console.error(
            "[CADASTRO]",
            signUpError.message
          );

          setError(
            signUpError.message
          );

          return;
        }

        if (
          rememberEmail
        ) {
          window.localStorage.setItem(
            REMEMBER_EMAIL_KEY,
            email.trim()
          );
        }

        setMessage(
          "Conta criada com sucesso. Faça login para continuar."
        );

        setMode(
          "login"
        );

        setPassword("");

        return;
      }

      /*
       * =====================================================
       * LOGIN SUPABASE
       * =====================================================
       */

      const {
        data:
          loginData,

        error:
          loginError,
      } =
        await supabase
          .auth
          .signInWithPassword({
            email:
              email.trim(),

            password,
          });

      if (
        loginError
      ) {
        console.error(
          "[LOGIN AUTH]",
          loginError.message
        );

        setError(
          "E-mail ou senha incorretos."
        );

        return;
      }

      if (
        !loginData.user ||
        !loginData.session
      ) {
        console.error(
          "[LOGIN AUTH] Supabase não retornou sessão válida."
        );

        setError(
          "Não foi possível criar sua sessão de login."
        );

        return;
      }

      /*
       * =====================================================
       * CRIA SESSÃO DE TELA
       * =====================================================
       */

      let sessionResponse:
        Response;

      try {
        sessionResponse =
          await fetch(
            "/api/session/start",
            {
              method:
                "POST",

              cache:
                "no-store",

              credentials:
                "include",
            }
          );

      } catch (
        fetchError
      ) {
        console.error(
          "[SESSION START FETCH]",
          fetchError
        );

        setError(
          "Não foi possível conectar ao controle de telas."
        );

        return;
      }

      /*
       * Lemos como texto primeiro.
       *
       * Assim não quebramos caso a API
       * devolva HTML, corpo vazio etc.
       */
      const rawSessionResponse =
        await sessionResponse
          .text();

      let sessionData:
        Record<
          string,
          unknown
        > = {};

      if (
        rawSessionResponse
          .trim()
      ) {
        try {
          sessionData =
            JSON.parse(
              rawSessionResponse
            );

        } catch {
          console.error(
            "[SESSION START] Resposta não-JSON:",
            {
              status:
                sessionResponse.status,

              preview:
                rawSessionResponse
                  .slice(
                    0,
                    200
                  ),
            }
          );

          await supabase
            .auth
            .signOut({
              scope:
                "local",
            });

          setError(
            `Erro ao iniciar sessão (${sessionResponse.status}).`
          );

          return;
        }
      }

      /*
       * =====================================================
       * ERRO AO INICIAR TELA
       * =====================================================
       */

      if (
        !sessionResponse.ok
      ) {
        console.log(
          "[SESSION START]",
          {
            status:
              sessionResponse.status,

            data:
              sessionData,
          }
        );

        await supabase
          .auth
          .signOut({
            scope:
              "local",
          });

        const reason =
          typeof sessionData
            .reason ===
          "string"
            ? sessionData.reason
            : "";

        if (
          reason ===
          "screen_limit"
        ) {
          const maxScreens =
            Number(
              sessionData
                .max_screens ??
              1
            );

          setError(
            `Limite de telas atingido. Este plano permite ${maxScreens} ${
              maxScreens ===
              1
                ? "tela"
                : "telas"
            } simultâneas.`
          );

          return;
        }

        if (
          reason ===
          "expired"
        ) {
          router.replace(
            "/acesso?motivo=expirado"
          );

          return;
        }

        if (
          reason ===
          "blocked"
        ) {
          router.replace(
            "/acesso?motivo=bloqueado"
          );

          return;
        }

        if (
          reason ===
          "waiting" ||
          reason ===
          "pending"
        ) {
          router.replace(
            "/acesso?motivo=aguardando"
          );

          return;
        }

        /*
         * Agora mostramos o HTTP real.
         *
         * Se aparecer 500/401/403,
         * saberemos exatamente onde olhar.
         */
        setError(
          `Não foi possível iniciar sua sessão. Código ${sessionResponse.status}.`
        );

        return;
      }

      /*
       * =====================================================
       * LOGIN CONCLUÍDO
       * =====================================================
       */

      if (
        rememberEmail
      ) {
        window.localStorage.setItem(
          REMEMBER_EMAIL_KEY,
          email.trim()
        );

      } else {
        window.localStorage.removeItem(
          REMEMBER_EMAIL_KEY
        );
      }

      router.replace("/");

      router.refresh();

    } catch (
      loginException
    ) {
      console.error(
        "[LOGIN UNEXPECTED]",
        loginException
      );

      setError(
        loginException instanceof
          Error
          ? `Erro inesperado: ${loginException.message}`
          : "Não foi possível concluir a operação."
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
        "Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
      );

    } catch (
      resetException
    ) {
      console.error(
        "[RESET PASSWORD]",
        resetException
      );

      setError(
        "Não foi possível solicitar a redefinição de senha."
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
              placeholder="••••••••"
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
            ? "Acesso exclusivo para usuários autorizados."
            : "Após o cadastro, seu acesso deverá ser liberado."}
        </p>
      </section>
    </main>
  );
}