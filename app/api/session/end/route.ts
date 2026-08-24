import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    createClient,
  } from "@/lib/supabase/server";
  
  export async function POST(
    request: NextRequest
  ) {
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
  
    const sessionKey =
      request.cookies.get(
        "bd_screen_session"
      )?.value;
  
    /*
     * Se existe usuário + cookie,
     * remove especificamente essa tela.
     */
    if (
      user &&
      sessionKey
    ) {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "end_screen_session",
          {
            p_session_key:
              sessionKey,
          }
        );
  
      if (error) {
        console.error(
          "[SESSION END] Erro:",
          error
        );
  
        return NextResponse.json(
          {
            success: false,
            error:
              error.message,
          },
          {
            status: 500,
          }
        );
      }
  
      console.log(
        "[SESSION END]",
        {
          user:
            user.email,
  
          sessionKey,
  
          removed:
            data,
        }
      );
    }
  
    const response =
      NextResponse.json({
        success: true,
  
        hadUser:
          Boolean(user),
  
        hadSession:
          Boolean(
            sessionKey
          ),
      });
  
    /*
     * Remove o cookie da tela.
     */
    response.cookies.set(
      "bd_screen_session",
      "",
      {
        httpOnly: true,
        sameSite: "lax",
  
        secure:
          process.env.NODE_ENV ===
          "production",
  
        path: "/",
  
        expires:
          new Date(0),
      }
    );
  
    return response;
  }