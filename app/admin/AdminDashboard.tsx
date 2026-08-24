"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import styles from "./admin.module.css";

export interface AdminUser {
  id: string;

  email:
    | string
    | null;

  name:
    | string
    | null;

  role:
    | "user"
    | "admin";

  status:
    | "active"
    | "blocked";

  access_until:
    | string
    | null;

  created_at:
    string;

  max_screens:
    number;

  plan_name:
    string;

  server_now:
    string;

  days_remaining:
    number;

  active_screens:
    number;
}

interface AdminSession {
  session_id:
    string;

  device_name:
    string | null;

  ip_address:
    string | null;

  user_agent:
    string | null;

  created_at:
    string;

  last_seen_at:
    string;

  revoked_at:
    string | null;

  is_active:
    boolean;

  seconds_since_seen:
    number;
}

interface Props {
  initialUsers:
    AdminUser[];
}

type AdminAction =
  | "demo_24h"
  | "add_days"
  | "set_expiration"
  | "remove_access"
  | "set_screens"
  | "block"
  | "unblock";

function formatDate(
  value:
    | string
    | null
) {
  if (!value) {
    return "Não liberado";
  }

  return new Intl
    .DateTimeFormat(
      "pt-BR",
      {
        dateStyle:
          "short",

        timeStyle:
          "short",

        timeZone:
          "America/Sao_Paulo",
      }
    )
    .format(
      new Date(
        value
      )
    );
}

function formatAgo(
  seconds:
    number
) {
  if (
    seconds <
    10
  ) {
    return "agora";
  }

  if (
    seconds <
    60
  ) {
    return `há ${seconds}s`;
  }

  const minutes =
    Math.floor(
      seconds /
      60
    );

  if (
    minutes <
    60
  ) {
    return `há ${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  return `há ${hours}h`;
}

function detectBrowser(
  userAgent:
    string | null
) {
  if (!userAgent) {
    return "Navegador";
  }

  const ua =
    userAgent
      .toLowerCase();

  if (
    ua.includes("opr/") ||
    ua.includes("opera")
  ) {
    return "Opera";
  }

  if (
    ua.includes("edg/")
  ) {
    return "Edge";
  }

  if (
    ua.includes("firefox")
  ) {
    return "Firefox";
  }

  if (
    ua.includes("chrome")
  ) {
    return "Chrome";
  }

  if (
    ua.includes("safari")
  ) {
    return "Safari";
  }

  return "Navegador";
}

function getUserState(
  user:
    AdminUser
) {
  if (
    user.role ===
    "admin"
  ) {
    return {
      label:
        "Administrador",

      type:
        "admin",
    };
  }

  if (
    user.status ===
    "blocked"
  ) {
    return {
      label:
        "Bloqueado",

      type:
        "blocked",
    };
  }

  if (
    !user.access_until
  ) {
    return {
      label:
        "Aguardando",

      type:
        "waiting",
    };
  }

  if (
    new Date(
      user.access_until
    ).getTime() <=
    new Date(
      user.server_now
    ).getTime()
  ) {
    return {
      label:
        "Expirado",

      type:
        "expired",
    };
  }

  return {
    label:
      "Ativo",

    type:
      "active",
  };
}

function getInitials(
  user:
    AdminUser
) {
  const value =
    user.name?.trim() ||
    user.email ||
    "US";

  const parts =
    value
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length >=
    2
  ) {
    return (
      parts[0][0] +
      parts[
        parts.length - 1
      ][0]
    ).toUpperCase();
  }

  return value
    .slice(
      0,
      2
    )
    .toUpperCase();
}

export default function AdminDashboard({
  initialUsers,
}: Props) {
  const router =
    useRouter();

  const [
    users,
    setUsers,
  ] =
    useState<
      AdminUser[]
    >(
      initialUsers
    );

  const [
    selected,
    setSelected,
  ] =
    useState<
      AdminUser |
      null
    >(
      null
    );

  const [
    sessions,
    setSessions,
  ] =
    useState<
      AdminSession[]
    >([]);

  const [
    sessionsLoading,
    setSessionsLoading,
  ] =
    useState(
      false
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    feedback,
    setFeedback,
  ] =
    useState("");

  const [
    customDate,
    setCustomDate,
  ] =
    useState("");

  /*
   * =========================================================
   * ATUALIZA LISTA APÓS router.refresh()
   * =========================================================
   */

  useEffect(() => {
    setUsers(
      initialUsers
    );

    if (
      selected
    ) {
      const updated =
        initialUsers.find(
          (
            item
          ) =>
            item.id ===
            selected.id
        );

      if (
        updated
      ) {
        setSelected(
          updated
        );
      }
    }

  }, [
    initialUsers,
    selected,
  ]);

  /*
   * =========================================================
   * CARREGA CONEXÕES
   * =========================================================
   *
   * IMPORTANTE:
   * copiamos selected.id para uma constante.
   *
   * Assim o TypeScript sabe que o valor
   * não poderá virar null dentro da função
   * assíncrona.
   */

  useEffect(() => {
    if (!selected) {
      setSessions([]);

      return;
    }

    const selectedUserId =
      selected.id;

    let active =
      true;

    async function loadSessions() {
      setSessionsLoading(
        true
      );

      try {
        const response =
          await fetch(
            `/api/admin/sessions?userId=${encodeURIComponent(
              selectedUserId
            )}`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response
            .json();

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
            "Erro carregando conexões."
          );
        }

        if (active) {
          setSessions(
            data.sessions ||
            []
          );
        }

      } catch (
        error
      ) {
        console.error(
          "[ADMIN SESSIONS]",
          error
        );

        if (active) {
          setFeedback(
            "Não foi possível carregar as conexões."
          );
        }

      } finally {
        if (active) {
          setSessionsLoading(
            false
          );
        }
      }
    }

    loadSessions();

    return () => {
      active = false;
    };

  }, [
    selected?.id,
  ]);

  /*
   * =========================================================
   * FILTRO
   * =========================================================
   */

  const filteredUsers =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return users;
        }

        return users.filter(
          (
            item
          ) =>
            item.name
              ?.toLowerCase()
              .includes(
                term
              ) ||
            item.email
              ?.toLowerCase()
              .includes(
                term
              )
        );
      },

      [
        users,
        search,
      ]
    );

  /*
   * =========================================================
   * MÉTRICAS
   * =========================================================
   */

  const normalUsers =
    users.filter(
      (
        item
      ) =>
        item.role !==
        "admin"
    );

  const activeUsers =
    normalUsers.filter(
      (
        item
      ) =>
        getUserState(
          item
        ).type ===
        "active"
    );

  const expiredUsers =
    normalUsers.filter(
      (
        item
      ) =>
        getUserState(
          item
        ).type ===
        "expired"
    );

  const waitingUsers =
    normalUsers.filter(
      (
        item
      ) =>
        getUserState(
          item
        ).type ===
        "waiting"
    );

  const expiringUsers =
    normalUsers.filter(
      (
        item
      ) =>
        getUserState(
          item
        ).type ===
          "active" &&
        item.days_remaining <=
          7
    );

  const activeConnections =
    users.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.active_screens ||
          0
        ),

      0
    );

  /*
   * =========================================================
   * AÇÕES ADMIN
   * =========================================================
   */

  async function action(
    action:
      AdminAction,

    value?:
      number,

    timestamp?:
      string
  ) {
    if (
      !selected ||
      loading
    ) {
      return;
    }

    const selectedUserId =
      selected.id;

    setLoading(
      true
    );

    setFeedback("");

    try {
      const response =
        await fetch(
          "/api/admin/manage-user",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                userId:
                  selectedUserId,

                action,

                value,

                timestamp,
              }),
          }
        );

      const data =
        await response
          .json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
          "Não foi possível realizar a ação."
        );
      }

      setFeedback(
        "Alteração salva com sucesso."
      );

      router.refresh();

    } catch (
      error
    ) {
      setFeedback(
        error instanceof
          Error
          ? error.message
          : "Erro inesperado."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  /*
   * =========================================================
   * DATA PERSONALIZADA
   * =========================================================
   */

  async function applyCustomDate() {
    if (
      !customDate
    ) {
      setFeedback(
        "Escolha uma data e horário."
      );

      return;
    }

    const date =
      new Date(
        customDate
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      setFeedback(
        "Data inválida."
      );

      return;
    }

    await action(
      "set_expiration",
      undefined,
      date.toISOString()
    );
  }

  /*
   * =========================================================
   * REMOVER ACESSO
   * =========================================================
   */

  async function removeAccess() {
    if (
      !selected
    ) {
      return;
    }

    const selectedName =
      selected.name ||
      selected.email ||
      "este usuário";

    const confirmed =
      window.confirm(
        `Remover imediatamente o acesso de ${selectedName}?`
      );

    if (!confirmed) {
      return;
    }

    await action(
      "remove_access"
    );
  }

  /*
   * =========================================================
   * DERRUBAR UMA CONEXÃO
   * =========================================================
   */

  async function revokeSession(
    sessionId:
      string
  ) {
    if (
      loading
    ) {
      return;
    }

    setLoading(
      true
    );

    setFeedback("");

    try {
      const response =
        await fetch(
          "/api/admin/sessions",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "revoke",

                sessionId,
              }),
          }
        );

      const data =
        await response
          .json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
          "Não foi possível derrubar a conexão."
        );
      }

      setSessions(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.session_id ===
              sessionId
                ? {
                    ...item,

                    is_active:
                      false,

                    revoked_at:
                      new Date()
                        .toISOString(),
                  }
                : item
          )
      );

      setFeedback(
        "Conexão derrubada com sucesso."
      );

      router.refresh();

    } catch (
      error
    ) {
      setFeedback(
        error instanceof
          Error
          ? error.message
          : "Erro ao derrubar conexão."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  /*
   * =========================================================
   * DERRUBAR TODAS AS CONEXÕES
   * =========================================================
   */

  async function revokeAllSessions() {
    if (
      !selected ||
      loading
    ) {
      return;
    }

    const selectedUserId =
      selected.id;

    const selectedName =
      selected.name ||
      selected.email ||
      "este usuário";

    const confirmed =
      window.confirm(
        `Derrubar todas as conexões de ${selectedName}?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    setLoading(
      true
    );

    setFeedback("");

    try {
      const response =
        await fetch(
          "/api/admin/sessions",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "revoke_all",

                userId:
                  selectedUserId,
              }),
          }
        );

      const data =
        await response
          .json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
          "Não foi possível derrubar as conexões."
        );
      }

      setSessions(
        (
          current
        ) =>
          current.map(
            (
              item
            ) => ({
              ...item,

              is_active:
                false,

              revoked_at:
                item.revoked_at ||
                new Date()
                  .toISOString(),
            })
          )
      );

      setFeedback(
        `${data.revoked || 0} conexão(ões) derrubada(s).`
      );

      router.refresh();

    } catch (
      error
    ) {
      setFeedback(
        error instanceof
          Error
          ? error.message
          : "Erro ao derrubar conexões."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  const activeSelectedSessions =
    sessions.filter(
      (
        item
      ) =>
        item.is_active
    );

  return (
    <>
      <section
        className={
          styles.metrics
        }
      >
        <article
          className={
            styles.metric
          }
        >
          <span>
            Usuários
          </span>

          <strong>
            {
              normalUsers.length
            }
          </strong>

          <small>
            cadastrados
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Ativos
          </span>

          <strong>
            {
              activeUsers.length
            }
          </strong>

          <small>
            com assinatura
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Expirados
          </span>

          <strong>
            {
              expiredUsers.length
            }
          </strong>

          <small>
            aguardando renovação
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Vencendo
          </span>

          <strong>
            {
              expiringUsers.length
            }
          </strong>

          <small>
            nos próximos 7 dias
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Pendentes
          </span>

          <strong>
            {
              waitingUsers.length
            }
          </strong>

          <small>
            sem liberação
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Conexões
          </span>

          <strong>
            {
              activeConnections
            }
          </strong>

          <small>
            ativas agora
          </small>
        </article>
      </section>

      <section
        className={
          styles.usersPanel
        }
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <div>
            <h2>
              Usuários
            </h2>

            <p>
              {
                users.length
              } registros
            </p>
          </div>

          <input
            className={
              styles.searchInput
            }
            type="search"
            placeholder="Buscar nome ou e-mail..."
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event
                  .target
                  .value
              )
            }
          />
        </div>

        <div
          className={
            styles.userList
          }
        >
          {filteredUsers.map(
            (
              item
            ) => {
              const state =
                getUserState(
                  item
                );

              return (
                <article
                  key={
                    item.id
                  }
                  className={
                    styles.userCard
                  }
                >
                  <div
                    className={
                      styles.identity
                    }
                  >
                    <div
                      className={
                        styles.avatar
                      }
                    >
                      {getInitials(
                        item
                      )}
                    </div>

                    <div>
                      <strong>
                        {item.name?.trim() ||
                          item.email ||
                          "Usuário"}
                      </strong>

                      <span>
                        {
                          item.email
                        }
                      </span>
                    </div>
                  </div>

                  <div
                    className={
                      styles.statusColumn
                    }
                  >
                    <span
                      className={`${styles.status} ${
                        styles[
                          state.type
                        ]
                      }`}
                    >
                      {
                        state.label
                      }
                    </span>

                    <small>
                      {item.role ===
                      "admin"
                        ? "Acesso ilimitado"
                        : formatDate(
                            item.access_until
                          )}
                    </small>
                  </div>

                  <div
                    className={
                      styles.info
                    }
                  >
                    <span>
                      Restante
                    </span>

                    <strong>
                      {item.role ===
                      "admin"
                        ? "∞"
                        : `${item.days_remaining} dias`}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.info
                    }
                  >
                    <span>
                      Plano
                    </span>

                    <strong>
                      {item.role ===
                      "admin"
                        ? "Admin"
                        : item.plan_name}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.info
                    }
                  >
                    <span>
                      Conexões
                    </span>

                    <strong>
                      {
                        item.active_screens
                      }

                      {" / "}

                      {item.role ===
                      "admin"
                        ? "∞"
                        : item.max_screens}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.manage
                    }
                    onClick={() => {
                      setSelected(
                        item
                      );

                      setFeedback("");

                      setCustomDate("");
                    }}
                  >
                    Gerenciar
                  </button>
                </article>
              );
            }
          )}
        </div>
      </section>

      {selected && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={() =>
            !loading &&
            setSelected(
              null
            )
          }
        >
          <section
            className={
              styles.modal
            }
            onMouseDown={(
              event
            ) =>
              event
                .stopPropagation()
            }
          >
            <header
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  Gerenciar usuário
                </span>

                <h2>
                  {selected.name?.trim() ||
                    selected.email}
                </h2>

                <p>
                  {
                    selected.email
                  }
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.modalClose
                }
                disabled={
                  loading
                }
                onClick={() =>
                  setSelected(
                    null
                  )
                }
              >
                ×
              </button>
            </header>

            <div
              className={
                styles.modalUserStatus
              }
            >
              <span>
                Vencimento
              </span>

              <strong>
                {selected.role ===
                "admin"
                  ? "Acesso ilimitado"
                  : formatDate(
                      selected.access_until
                    )}
              </strong>
            </div>

            {selected.role !==
              "admin" && (
              <>
                <div
                  className={
                    styles.modalSection
                  }
                >
                  <h3>
                    Liberar acesso
                  </h3>

                  <p>
                    Adicione tempo usando
                    o horário seguro do
                    servidor.
                  </p>

                  <div
                    className={
                      styles.quickActions
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.demoButton
                      }
                      disabled={
                        loading
                      }
                      onClick={() =>
                        action(
                          "demo_24h"
                        )
                      }
                    >
                      DEMO • +24h
                    </button>

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        action(
                          "add_days",
                          7
                        )
                      }
                    >
                      +7 dias
                    </button>

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        action(
                          "add_days",
                          30
                        )
                      }
                    >
                      +30 dias
                    </button>

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        action(
                          "add_days",
                          90
                        )
                      }
                    >
                      +90 dias
                    </button>
                  </div>
                </div>

                <div
                  className={
                    styles.modalSection
                  }
                >
                  <h3>
                    Vencimento personalizado
                  </h3>

                  <p>
                    Escolha exatamente
                    a data e o horário
                    de término do acesso.
                  </p>

                  <div
                    className={
                      styles.customDateRow
                    }
                  >
                    <input
                      type="datetime-local"
                      value={
                        customDate
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomDate(
                          event
                            .target
                            .value
                        )
                      }
                    />

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={
                        applyCustomDate
                      }
                    >
                      Aplicar data
                    </button>
                  </div>
                </div>

                <div
                  className={
                    styles.modalSection
                  }
                >
                  <h3>
                    Quantidade de telas
                  </h3>

                  <p>
                    Limite de conexões
                    simultâneas.
                  </p>

                  <div
                    className={
                      styles.screenGrid
                    }
                  >
                    {[1, 2, 3, 4].map(
                      (
                        screens
                      ) => (
                        <button
                          key={
                            screens
                          }
                          type="button"
                          disabled={
                            loading
                          }
                          className={
                            selected.max_screens ===
                            screens
                              ? styles.activeScreen
                              : ""
                          }
                          onClick={() =>
                            action(
                              "set_screens",
                              screens
                            )
                          }
                        >
                          {
                            screens
                          }

                          <small>
                            {screens ===
                            1
                              ? "tela"
                              : "telas"}
                          </small>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}

            <div
              className={
                styles.modalSection
              }
            >
              <div
                className={
                  styles.sessionsHeader
                }
              >
                <div>
                  <h3>
                    Conexões
                  </h3>

                  <p>
                    Dispositivos conectados
                    a esta conta.
                  </p>
                </div>

                <span
                  className={
                    styles.sessionCount
                  }
                >
                  {
                    activeSelectedSessions.length
                  } ativa(s)
                </span>
              </div>

              {sessionsLoading ? (
                <div
                  className={
                    styles.sessionsEmpty
                  }
                >
                  Carregando conexões...
                </div>

              ) : activeSelectedSessions.length ===
                0 ? (
                <div
                  className={
                    styles.sessionsEmpty
                  }
                >
                  Nenhuma conexão ativa.
                </div>

              ) : (
                <div
                  className={
                    styles.sessionsList
                  }
                >
                  {activeSelectedSessions.map(
                    (
                      session
                    ) => (
                      <div
                        key={
                          session.session_id
                        }
                        className={
                          styles.sessionCard
                        }
                      >
                        <div
                          className={
                            styles.sessionTop
                          }
                        >
                          <div>
                            <strong>
                              {session.device_name ||
                                "Dispositivo"}

                              {" • "}

                              {detectBrowser(
                                session.user_agent
                              )}
                            </strong>

                            <span>
                              Ativo{" "}
                              {formatAgo(
                                session.seconds_since_seen
                              )}
                            </span>
                          </div>

                          <span
                            className={
                              styles.onlineDot
                            }
                          />
                        </div>

                        <div
                          className={
                            styles.sessionMeta
                          }
                        >
                          <span>
                            IP
                          </span>

                          <strong>
                            {session.ip_address ||
                              "Não identificado"}
                          </strong>
                        </div>

                        <div
                          className={
                            styles.sessionMeta
                          }
                        >
                          <span>
                            Conectado desde
                          </span>

                          <strong>
                            {formatDate(
                              session.created_at
                            )}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className={
                            styles.revokeSession
                          }
                          disabled={
                            loading
                          }
                          onClick={() =>
                            revokeSession(
                              session.session_id
                            )
                          }
                        >
                          Derrubar conexão
                        </button>
                      </div>
                    )
                  )}

                  {selected.role !==
                    "admin" &&
                    activeSelectedSessions.length >
                      1 && (
                    <button
                      type="button"
                      className={
                        styles.revokeAll
                      }
                      disabled={
                        loading
                      }
                      onClick={
                        revokeAllSessions
                      }
                    >
                      Derrubar todas as conexões
                    </button>
                  )}
                </div>
              )}
            </div>

            {selected.role !==
              "admin" && (
              <>
                <div
                  className={
                    styles.modalSection
                  }
                >
                  <h3>
                    Remover acesso
                  </h3>

                  <p>
                    A conta continua cadastrada,
                    mas volta para
                    "Aguardando liberação".
                  </p>

                  <button
                    type="button"
                    className={
                      styles.removeAccessButton
                    }
                    disabled={
                      loading
                    }
                    onClick={
                      removeAccess
                    }
                  >
                    Remover acesso imediatamente
                  </button>
                </div>

                <div
                  className={
                    styles.modalSection
                  }
                >
                  <h3>
                    Status da conta
                  </h3>

                  {selected.status ===
                  "blocked" ? (
                    <button
                      type="button"
                      className={
                        styles.unblockButton
                      }
                      disabled={
                        loading
                      }
                      onClick={() =>
                        action(
                          "unblock"
                        )
                      }
                    >
                      Desbloquear conta
                    </button>

                  ) : (
                    <button
                      type="button"
                      className={
                        styles.blockButton
                      }
                      disabled={
                        loading
                      }
                      onClick={() =>
                        action(
                          "block"
                        )
                      }
                    >
                      Bloquear conta
                    </button>
                  )}
                </div>
              </>
            )}

            {feedback && (
              <div
                className={
                  styles.feedback
                }
              >
                {
                  feedback
                }
              </div>
            )}

            {loading && (
              <div
                className={
                  styles.saving
                }
              >
                Salvando alteração...
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}