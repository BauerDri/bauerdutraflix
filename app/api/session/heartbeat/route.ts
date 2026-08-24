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
    const sessionKey =
      request.cookies.get(
        "bd_screen_session"
      )?.value;
  
    if (!sessionKey) {
      return NextResponse.json(
        {
          active: false,
          reason:
            "missing_session",
        },
        {
          status: 401,
        }
      );
    }
  
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
          active: false,
          reason:
            "not_authenticated",
        },
        {
          status: 401,
        }
      );
    }
  
    const {
      data,
      error,
    } =
      await supabase.rpc(
        "heartbeat_screen_session",
        {
          p_session_key:
            sessionKey,
        }
      );
  
    if (
      error ||
      data !== true
    ) {
      return NextResponse.json(
        {
          active: false,
          reason:
            "session_ended",
        },
        {
          status: 403,
        }
      );
    }
  
    return NextResponse.json({
      active: true,
    });
  }