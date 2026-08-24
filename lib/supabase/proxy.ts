import {
    createServerClient,
  } from "@supabase/ssr";
  
  import {
    NextResponse,
    type NextRequest,
  } from "next/server";
  
  export async function updateSession(
    request: NextRequest
  ) {
    let response =
      NextResponse.next({
        request,
      });
  
    const supabase =
      createServerClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
  
        process.env
          .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  
        {
          cookies: {
            getAll() {
              return request
                .cookies
                .getAll();
            },
  
            setAll(
              cookiesToSet
            ) {
              cookiesToSet.forEach(
                ({
                  name,
                  value,
                }) =>
                  request
                    .cookies
                    .set(
                      name,
                      value
                    )
              );
  
              response =
                NextResponse.next({
                  request,
                });
  
              cookiesToSet.forEach(
                ({
                  name,
                  value,
                  options,
                }) =>
                  response
                    .cookies
                    .set(
                      name,
                      value,
                      options
                    )
              );
            },
          },
        }
      );
  
    /*
     * =========================================================
     * VALIDA USUÁRIO / RENOVA SESSÃO
     * =========================================================
     */
  
    const {
      data: {
        user,
      },
    } =
      await supabase
        .auth
        .getUser();
  
    const pathname =
      request
        .nextUrl
        .pathname;
  
    /*
     * =========================================================
     * ROTAS PÚBLICAS
     * =========================================================
     *
     * Essas páginas podem ser abertas
     * sem assinatura ativa.
     */
  
    const publicRoutes = [
      "/login",
      "/acesso",
      "/redefinir-senha",
    ];
  
    const isPublicRoute =
      publicRoutes.some(
        (
          route
        ) =>
          pathname ===
            route ||
          pathname.startsWith(
            `${route}/`
          )
      );
  
    /*
     * =========================================================
     * NÃO LOGADO
     * =========================================================
     */
  
    if (
      !user &&
      !isPublicRoute
    ) {
      const url =
        request
          .nextUrl
          .clone();
  
      url.pathname =
        "/login";
  
      url.search = "";
  
      return NextResponse.redirect(
        url
      );
    }
  
    /*
     * =========================================================
     * USUÁRIO LOGADO EM ROTA PROTEGIDA
     * =========================================================
     */
  
    if (
      user &&
      !isPublicRoute
    ) {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "get_my_access_status"
        );
  
      /*
       * Erro consultando assinatura.
       */
      if (error) {
        console.error(
          "[AUTH] Erro verificando acesso:",
          error
        );
  
        const url =
          request
            .nextUrl
            .clone();
  
        url.pathname =
          "/acesso";
  
        url.search =
          "?motivo=erro";
  
        return NextResponse.redirect(
          url
        );
      }
  
      const access =
        Array.isArray(
          data
        )
          ? data[0]
          : null;
  
      /*
       * Perfil não encontrado.
       */
      if (!access) {
        const url =
          request
            .nextUrl
            .clone();
  
        url.pathname =
          "/acesso";
  
        url.search =
          "?motivo=sem-perfil";
  
        return NextResponse.redirect(
          url
        );
      }
  
      /*
       * Conta bloqueada.
       */
      if (
        access.status ===
        "blocked"
      ) {
        const url =
          request
            .nextUrl
            .clone();
  
        url.pathname =
          "/acesso";
  
        url.search =
          "?motivo=bloqueado";
  
        return NextResponse.redirect(
          url
        );
      }
  
      /*
       * Conta criada,
       * mas ainda sem liberação.
       *
       * Admin ignora essa regra.
       */
      if (
        access.access_until ===
          null &&
        access.role !==
          "admin"
      ) {
        const url =
          request
            .nextUrl
            .clone();
  
        url.pathname =
          "/acesso";
  
        url.search =
          "?motivo=aguardando";
  
        return NextResponse.redirect(
          url
        );
      }
  
      /*
       * Assinatura vencida.
       */
      if (
        !access.has_access
      ) {
        const url =
          request
            .nextUrl
            .clone();
  
        url.pathname =
          "/acesso";
  
        url.search =
          "?motivo=expirado";
  
        return NextResponse.redirect(
          url
        );
      }
    }
  
    return response;
  }