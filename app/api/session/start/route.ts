import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    randomUUID,
  } from "crypto";
  
  import {
    createClient,
  } from "@/lib/supabase/server";
  
  function getDeviceName(
    userAgent: string
  ) {
    const ua =
      userAgent.toLowerCase();
  
    if (
      ua.includes("iphone")
    ) {
      return "iPhone";
    }
  
    if (
      ua.includes("ipad")
    ) {
      return "iPad";
    }
  
    if (
      ua.includes("android")
    ) {
      return "Android";
    }
  
    if (
      ua.includes("windows")
    ) {
      return "Windows";
    }
  
    if (
      ua.includes("macintosh") ||
      ua.includes("mac os")
    ) {
      return "Mac";
    }
  
    if (
      ua.includes("linux")
    ) {
      return "Linux";
    }
  
    return "Dispositivo";
  }
  
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
  
    if (!user) {
      return NextResponse.json(
        {
          allowed: false,
          reason:
            "not_authenticated",
        },
        {
          status: 401,
        }
      );
    }
  
    /*
     * Cada LOGIN recebe uma chave
     * independente de tela.
     */
    const sessionKey =
      randomUUID();
  
    const userAgent =
      request.headers.get(
        "user-agent"
      ) || "";
  
    const forwarded =
      request.headers.get(
        "x-forwarded-for"
      );
  
    const ip =
      forwarded
        ?.split(",")[0]
        ?.trim() ||
      request.headers.get(
        "x-real-ip"
      ) ||
      null;
  
    const {
      data,
      error,
    } =
      await supabase.rpc(
        "start_screen_session",
        {
          p_session_key:
            sessionKey,
  
          p_device_name:
            getDeviceName(
              userAgent
            ),
  
          p_ip_address:
            ip,
  
          p_user_agent:
            userAgent,
        }
      );
  
    if (error) {
      console.error(
        "[SESSION START]",
        error
      );
  
      return NextResponse.json(
        {
          allowed: false,
          reason:
            "server_error",
        },
        {
          status: 500,
        }
      );
    }
  
    const result =
      Array.isArray(data)
        ? data[0]
        : null;
  
    if (
      !result ||
      !result.allowed
    ) {
      return NextResponse.json(
        result || {
          allowed: false,
          reason:
            "server_error",
        },
        {
          status: 403,
        }
      );
    }
  
    const response =
      NextResponse.json(
        result
      );
  
    /*
     * Cookie HttpOnly:
     * o JavaScript do navegador
     * não consegue alterar a chave.
     */
    response.cookies.set(
      "bd_screen_session",
      sessionKey,
      {
        httpOnly: true,
  
        sameSite:
          "lax",
  
        secure:
          process.env
            .NODE_ENV ===
          "production",
  
        path: "/",
  
        maxAge:
          60 *
          60 *
          24 *
          30,
      }
    );
  
    return response;
  }