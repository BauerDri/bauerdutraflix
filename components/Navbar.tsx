"use client";

import Link from "next/link";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  usePathname,
  useRouter,
} from "next/navigation";

interface MenuItem {
  href: string;
  label: string;
  icon: ReactNode;

  match?: (
    pathname: string
  ) => boolean;
}

interface AccessStatus {
  role:
    | "user"
    | "admin";

  access_until:
    | string
    | null;

  server_now:
    string;

  days_remaining:
    number;

  has_access:
    boolean;
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MovieIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3 10h18M7 6l2-3m4 3 2-3m4 3 2-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SeriesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="15"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m9 9 6 3.5L9 16z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 20.5S4 16 4 9.5A4.5 4.5 0 0 1 12 6.7a4.5 4.5 0 0 1 8 2.8C20 16 12 20.5 12 20.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M10 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 8l4 4-4 4M9 12h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9.5 12.2 11.3 14l3.7-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const menuItems: MenuItem[] = [
  {
    href: "/",
    label: "Início",
    icon: <HomeIcon />,

    match: (
      pathname
    ) =>
      pathname === "/",
  },

  {
    href: "/filmes",
    label: "Filmes",
    icon: <MovieIcon />,

    match: (
      pathname
    ) =>
      pathname.startsWith(
        "/filmes"
      ) ||
      pathname.startsWith(
        "/filme/"
      ) ||
      pathname.startsWith(
        "/assistir/filme/"
      ),
  },

  {
    href: "/series",
    label: "Séries",
    icon: <SeriesIcon />,

    match: (
      pathname
    ) =>
      pathname.startsWith(
        "/series"
      ) ||
      pathname.startsWith(
        "/serie/"
      ) ||
      pathname.startsWith(
        "/assistir/serie/"
      ),
  },

  {
    href: "/favoritos",
    label: "Favoritos",
    icon: <HeartIcon />,

    match: (
      pathname
    ) =>
      pathname.startsWith(
        "/favoritos"
      ),
  },
];

function getInitials(
  value: string
) {
  const cleaned =
    value.trim();

  if (!cleaned) {
    return "BD";
  }

  if (
    cleaned.includes("@")
  ) {
    return cleaned
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase();
  }

  const parts =
    cleaned
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return (
      parts[0][0] +
      parts[
        parts.length - 1
      ][0]
    ).toUpperCase();
  }

  return cleaned
    .slice(0, 2)
    .toUpperCase();
}

function formatAccessDate(
  value:
    | string
    | null
) {
  if (!value) {
    return "";
  }

  return new Intl
    .DateTimeFormat(
      "pt-BR",
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",

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

export default function Navbar() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    profileName,
    setProfileName,
  ] = useState("");

  const [
    profileEmail,
    setProfileEmail,
  ] = useState("");

  const [
    profileRole,
    setProfileRole,
  ] =
    useState<
      "user" | "admin"
    >("user");

  const [
    profileLoaded,
    setProfileLoaded,
  ] = useState(false);

  const [
    accessStatus,
    setAccessStatus,
  ] =
    useState<
      AccessStatus |
      null
    >(null);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const visibleMenuItems: MenuItem[] =
    profileRole ===
    "admin"
      ? [
          ...menuItems,

          {
            href: "/admin",
            label:
              "Administração",

            icon:
              <AdminIcon />,

            match: (
              currentPath
            ) =>
              currentPath.startsWith(
                "/admin"
              ),
          },
        ]
      : menuItems;

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase =
        createClient();

      const {
        data: {
          user,
        },
      } =
        await supabase
          .auth
          .getUser();

      if (
        !user ||
        !active
      ) {
        if (active) {
          setProfileLoaded(
            true
          );
        }

        return;
      }

      const {
        data:
          profile,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "name,email,role"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      const {
        data:
          accessData,
      } =
        await supabase
          .rpc(
            "get_my_access_status"
          );

      if (!active) {
        return;
      }

      const access =
        Array.isArray(
          accessData
        )
          ? accessData[0]
          : null;

      const email =
        profile?.email ||
        user.email ||
        "";

      const metadataName =
        typeof user
          .user_metadata
          ?.name ===
        "string"
          ? user
              .user_metadata
              .name
              .trim()
          : "";

      const databaseName =
        typeof profile
          ?.name ===
        "string"
          ? profile
              .name
              .trim()
          : "";

      const displayName =
        databaseName ||
        metadataName ||
        email ||
        "Usuário";

      setProfileName(
        displayName
      );

      setProfileEmail(
        email
      );

      setProfileRole(
        profile?.role ===
          "admin"
          ? "admin"
          : "user"
      );

      setAccessStatus(
        access
      );

      setProfileLoaded(
        true
      );
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(
      true
    );

    const supabase =
      createClient();

    try {
      /*
       * Primeiro libera APENAS a tela atual
       * no nosso controle de sessões.
       */
      const sessionResponse =
        await fetch(
          "/api/session/end",
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
        !sessionResponse.ok
      ) {
        console.error(
          "[LOGOUT] Não foi possível liberar a tela."
        );
      }

      /*
       * MUITO IMPORTANTE:
       *
       * scope local = encerra somente
       * esta sessão deste navegador.
       *
       * Não revoga celular, PC, tablet etc.
       */
      const {
        error:
          signOutError,
      } =
        await supabase
          .auth
          .signOut({
            scope:
              "local",
          });

      if (
        signOutError
      ) {
        console.error(
          "[LOGOUT] Não foi possível encerrar a sessão local."
        );
      }

      setMobileOpen(
        false
      );

      router.replace(
        "/login"
      );

      router.refresh();

    } catch {
      /*
       * Mesmo se nosso endpoint falhar,
       * tentamos limpar somente esta
       * sessão local.
       */
      try {
        await supabase
          .auth
          .signOut({
            scope:
              "local",
          });

      } catch {
        // nada
      }

      router.replace(
        "/login"
      );

      router.refresh();

    } finally {
      setLoggingOut(
        false
      );
    }
  }

  function submit(
    event:
      FormEvent
  ) {
    event.preventDefault();

    const value =
      query.trim();

    if (!value) {
      return;
    }

    router.push(
      `/busca?q=${encodeURIComponent(
        value
      )}`
    );

    setMobileOpen(
      false
    );
  }

  useEffect(() => {
    setMobileOpen(
      false
    );
  }, [
    pathname,
  ]);

  useEffect(() => {
    if (
      !mobileOpen
    ) {
      document
        .body
        .style
        .overflow =
        "";

      return;
    }

    document
      .body
      .style
      .overflow =
      "hidden";

    return () => {
      document
        .body
        .style
        .overflow =
        "";
    };

  }, [
    mobileOpen,
  ]);

  const accessDate =
    formatAccessDate(
      accessStatus
        ?.access_until ||
      null
    );

  const daysRemaining =
    accessStatus
      ?.days_remaining ??
    0;

  return (
    <>
      <header
        className="topbar"
      >
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Abrir menu"
          onClick={() =>
            setMobileOpen(
              true
            )
          }
        >
          <MenuIcon />
        </button>

        <Link
          href="/"
          className="topbar-logo"
        >
          BauerDutraFlix
        </Link>

        <form
          className="top-search"
          onSubmit={
            submit
          }
        >
          <SearchIcon />

          <input
            type="search"
            value={query}
            onChange={(
              event
            ) =>
              setQuery(
                event
                  .target
                  .value
              )
            }
            placeholder="Buscar filmes e séries"
            aria-label="Buscar filmes e séries"
          />

          {query && (
            <button
              type="button"
              className="clear-search"
              aria-label="Limpar busca"
              onClick={() =>
                setQuery("")
              }
            >
              ×
            </button>
          )}
        </form>
      </header>

      <aside
        className={
          mobileOpen
            ? "sidebar mobile-open"
            : "sidebar"
        }
      >
        <div
          className="sidebar-header"
        >
          <Link
            href="/"
            className="sidebar-brand"
          >
            <span
              className="sidebar-brand-mark"
            >
              B
            </span>

            <span
              className="sidebar-brand-name"
            >
              BauerDutraFlix
            </span>
          </Link>

          <button
            type="button"
            className="mobile-close-button"
            aria-label="Fechar menu"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
          >
            <CloseIcon />
          </button>
        </div>

        <nav
          className="sidebar-navigation"
        >
          {visibleMenuItems.map(
            (
              item
            ) => {
              const active =
                item.match?.(
                  pathname
                ) ??
                pathname ===
                  item.href;

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={
                    active
                      ? "sidebar-link active"
                      : "sidebar-link"
                  }
                >
                  <span
                    className="sidebar-link-icon"
                  >
                    {
                      item.icon
                    }
                  </span>

                  <span
                    className="sidebar-link-label"
                  >
                    {
                      item.label
                    }
                  </span>
                </Link>
              );
            }
          )}
        </nav>

        <div
          className="sidebar-footer"
        >
          <div
            className="sidebar-user"
          >
            <div
              className="sidebar-avatar"
            >
              {profileLoaded
                ? getInitials(
                    profileName ||
                    profileEmail
                  )
                : "..."}
            </div>

            <div
              className="sidebar-user-copy"
            >
              <strong>
                {profileLoaded
                  ? profileName ||
                    profileEmail ||
                    "Usuário"
                  : "Carregando..."}
              </strong>

              <span>
                {!profileLoaded
                  ? "Carregando perfil..."
                  : profileRole ===
                      "admin"
                    ? "Administrador"
                    : profileEmail ||
                      "Usuário"}
              </span>
            </div>
          </div>

          {profileLoaded &&
            profileRole !==
              "admin" &&
            accessStatus
              ?.has_access && (
              <div
                className={
                  daysRemaining <=
                  3
                    ? "sidebar-access sidebar-access-warning"
                    : "sidebar-access"
                }
              >
                <span>
                  Acesso até
                </span>

                <strong>
                  {
                    accessDate
                  }
                </strong>

                <small>
                  {daysRemaining <=
                  1
                    ? "Vence amanhã"
                    : `${daysRemaining} dias restantes`}
                </small>
              </div>
            )}

          {profileLoaded &&
            profileRole ===
              "admin" && (
              <div
                className="sidebar-access sidebar-access-admin"
              >
                <span>
                  Plano
                </span>

                <strong>
                  Acesso ilimitado
                </strong>
              </div>
            )}

          <button
            type="button"
            className="sidebar-logout"
            onClick={
              logout
            }
            disabled={
              loggingOut
            }
          >
            <span
              className="sidebar-logout-icon"
            >
              <LogoutIcon />
            </span>

            <span>
              {loggingOut
                ? "Liberando tela..."
                : "Sair"}
            </span>
          </button>
        </div>
      </aside>

      <button
        type="button"
        aria-label="Fechar menu"
        className={
          mobileOpen
            ? "sidebar-backdrop visible"
            : "sidebar-backdrop"
        }
        onClick={() =>
          setMobileOpen(
            false
          )
        }
      />
    </>
  );
}