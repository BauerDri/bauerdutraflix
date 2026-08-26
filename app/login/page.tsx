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
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    rememberEmail,
    setRememberEmail,
  ] =
    useState(true);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  /*
   * =========================================================
   * WHATSAPP - TESTE GRÁTIS
   * =========================================================
   *
   * Essa mensagem é diferente da renovação.
   *
   * Assim você sabe imediatamente se a pessoa
   * está pedindo um teste ou renovando acesso.
   */

  const trialWhatsappMessage =
    "Olá! Quero solicitar um teste grátis de 24 horas do BauerDutraFlix.";

  const trialWhatsappUrl =
    "https://wa.me/5521974252410" +
    `?text=${encodeURIComponent(
      trialWhatsappMessage
    )}`;


  /*
   * =========================================================
   * LEMBRAR E-MAIL
   * =========================================================
   */

  useEffect(() => {
    const remembered =
      window
        .localStorage
        .getItem(
          REMEMBER_EMAIL_KEY
        );

    if (
      remembered
    ) {
      setEmail(
        remembered
      );
    }

  }, []);


  /*
   * =========================================================
   * LOGIN / CADASTRO
   * =========================================================
   */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(
      true
    );

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
          window
            .localStorage
            .setItem(
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
       * Lemos primeiro como texto.
       *
       * Isso evita quebrar caso algum
       * endpoint devolva HTML ou corpo vazio.
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

      router.replace(
        "/"
      );

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


  /*
   * =========================================================
   * ESQUECI MINHA SENHA
   * =========================================================
   */

  async function forgotPassword() {
    const value =
      email.trim();

    setError("");

    setMessage("");

    if (
      !value
    ) {
      setError(
        "Digite seu e-mail primeiro."
      );

      return;
    }

    setLoading(
      true
    );

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
      setLoading(
        false
      );
    }
  }


  /*
   * =========================================================
   * ALTERA LOGIN / CADASTRO
   * =========================================================
   */

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


  /*
   * =========================================================
   * INTERFACE
   * =========================================================
   */

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


        {/* ==================================================
            ABAS
           ================================================== */}

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


        {/* ==================================================
            FORMULÁRIO
           ================================================== */}

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
                value={
                  name
                }
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
              value={
                email
              }
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
              minLength={
                6
              }
              autoComplete={
                mode ===
                "login"
                  ? "current-password"
                  : "new-password"
              }
            />
          </label>


          {/* ================================================
              OPÇÕES LOGIN
             ================================================ */}

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


          {/* ================================================
              ERROS / SUCESSO
             ================================================ */}

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


          {/* ================================================
              ENTRAR / CADASTRAR
             ================================================ */}

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


          {/* ================================================
              TESTE GRÁTIS
             ================================================ */}

          {mode ===
            "login" && (
            <div
              style={{
                marginTop:
                  "8px",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                gap:
                  "10px",
              }}
            >
              <span
                style={{
                  color:
                    "#777781",

                  fontSize:
                    "13px",

                  fontWeight:
                    600,
                }}
              >
                Ainda não é cliente?
              </span>

              <a
                href={
                  trialWhatsappUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width:
                    "100%",

                  minHeight:
                    "52px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  borderRadius:
                    "12px",

                  border:
                    "1px solid rgba(37, 211, 102, .30)",

                  background:
                    "rgba(37, 211, 102, .10)",

                  color:
                    "#54e58a",

                  fontSize:
                    "15px",

                  fontWeight:
                    800,

                  textDecoration:
                    "none",

                  transition:
                    "all .2s ease",

                  boxSizing:
                    "border-box",
                }}
              >
                💬 Solicitar teste grátis
              </a>

              <small
                style={{
                  color:
                    "#62626d",

                  fontSize:
                    "11px",

                  textAlign:
                    "center",

                  lineHeight:
                    1.45,
                }}
              >
                Fale conosco pelo WhatsApp e solicite seu acesso por 24 horas.
              </small>
            </div>
          )}
        </form>


        {/* ==================================================
            RODAPÉ
           ================================================== */}

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