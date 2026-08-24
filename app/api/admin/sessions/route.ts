import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    revalidatePath,
  } from "next/cache";
  
  import {
    createClient,
  } from "@/lib/supabase/server";
  
  
  async function requireAdmin() {
    const supabase =
      await createClient();
  
  
    const {
      data: {
        user,
      },
    } =
      await supabase
        .auth
        .getUser();
  
  
    if (!user) {
      return {
        supabase,
        user: null,
        error:
          "Não autenticado.",
      };
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
          "role,status"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();
  
  
    if (
      !profile ||
      profile.role !==
        "admin" ||
      profile.status !==
        "active"
    ) {
      return {
        supabase,
        user,
        error:
          "Acesso negado.",
      };
    }
  
  
    return {
      supabase,
      user,
      error: null,
    };
  }
  
  
  /*
   * ============================================================
   * GET
   *
   * Lista conexões de um usuário.
   *
   * /api/admin/sessions?userId=UUID
   * ============================================================
   */
  
  export async function GET(
    request:
      NextRequest
  ) {
    try {
      const {
        supabase,
        error:
          authError,
      } =
        await requireAdmin();
  
  
      if (authError) {
        return NextResponse.json(
          {
            error:
              authError,
          },
  
          {
            status: 403,
          }
        );
      }
  
  
      const userId =
        request
          .nextUrl
          .searchParams
          .get(
            "userId"
          );
  
  
      if (!userId) {
        return NextResponse.json(
          {
            error:
              "Usuário não informado.",
          },
  
          {
            status: 400,
          }
        );
      }
  
  
      const {
        data,
        error,
      } =
        await supabase
          .rpc(
            "admin_list_sessions",
            {
              p_user_id:
                userId,
            }
          );
  
  
      if (error) {
        console.error(
          "[ADMIN SESSIONS GET]",
          error
        );
  
        return NextResponse.json(
          {
            error:
              error.message,
          },
  
          {
            status: 400,
          }
        );
      }
  
  
      return NextResponse.json({
        sessions:
          data || [],
      });
  
    } catch (
      error
    ) {
      console.error(
        "[ADMIN SESSIONS GET]",
        error
      );
  
      return NextResponse.json(
        {
          error:
            "Erro interno.",
        },
  
        {
          status: 500,
        }
      );
    }
  }
  
  
  /*
   * ============================================================
   * POST
   *
   * revoke     → derruba 1 sessão
   * revoke_all → derruba todas
   * ============================================================
   */
  
  export async function POST(
    request:
      NextRequest
  ) {
    try {
      const {
        supabase,
        error:
          authError,
      } =
        await requireAdmin();
  
  
      if (authError) {
        return NextResponse.json(
          {
            error:
              authError,
          },
  
          {
            status: 403,
          }
        );
      }
  
  
      const body =
        await request.json();
  
  
      const action =
        body?.action;
  
  
      /*
       * ========================================================
       * UMA SESSÃO
       * ========================================================
       */
  
      if (
        action ===
        "revoke"
      ) {
        const sessionId =
          body?.sessionId;
  
  
        if (!sessionId) {
          return NextResponse.json(
            {
              error:
                "Sessão não informada.",
            },
  
            {
              status: 400,
            }
          );
        }
  
  
        const {
          data,
          error,
        } =
          await supabase
            .rpc(
              "admin_revoke_session",
              {
                p_session_id:
                  sessionId,
              }
            );
  
  
        if (error) {
          return NextResponse.json(
            {
              error:
                error.message,
            },
  
            {
              status: 400,
            }
          );
        }
  
  
        revalidatePath(
          "/admin"
        );
  
  
        return NextResponse.json({
          success: true,
          revoked:
            data === true,
        });
      }
  
  
      /*
       * ========================================================
       * TODAS AS SESSÕES
       * ========================================================
       */
  
      if (
        action ===
        "revoke_all"
      ) {
        const userId =
          body?.userId;
  
  
        if (!userId) {
          return NextResponse.json(
            {
              error:
                "Usuário não informado.",
            },
  
            {
              status: 400,
            }
          );
        }
  
  
        const {
          data,
          error,
        } =
          await supabase
            .rpc(
              "admin_revoke_all_sessions",
              {
                p_user_id:
                  userId,
              }
            );
  
  
        if (error) {
          return NextResponse.json(
            {
              error:
                error.message,
            },
  
            {
              status: 400,
            }
          );
        }
  
  
        revalidatePath(
          "/admin"
        );
  
  
        return NextResponse.json({
          success: true,
  
          revoked:
            Number(
              data || 0
            ),
        });
      }
  
  
      return NextResponse.json(
        {
          error:
            "Ação inválida.",
        },
  
        {
          status: 400,
        }
      );
  
    } catch (
      error
    ) {
      console.error(
        "[ADMIN SESSIONS POST]",
        error
      );
  
  
      return NextResponse.json(
        {
          error:
            "Erro interno.",
        },
  
        {
          status: 500,
        }
      );
    }
  }