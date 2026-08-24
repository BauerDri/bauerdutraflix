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

type AdminAction =
  | "demo_24h"
  | "add_days"
  | "set_expiration"
  | "remove_access"
  | "set_screens"
  | "block"
  | "unblock";

interface RequestBody {
  userId?: string;
  action?: AdminAction;
  value?: number;
  timestamp?: string;
}

export async function POST(
  request: NextRequest
) {
  try {
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
          error:
            "Não autenticado.",
        },
        {
          status: 401,
        }
      );
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
      return NextResponse.json(
        {
          error:
            "Acesso negado.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      (
        await request.json()
      ) as RequestBody;

    const {
      userId,
      action,
      value,
      timestamp,
    } =
      body;

    if (
      !userId ||
      !action
    ) {
      return NextResponse.json(
        {
          error:
            "Dados incompletos.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedActions:
      AdminAction[] = [
        "demo_24h",
        "add_days",
        "set_expiration",
        "remove_access",
        "set_screens",
        "block",
        "unblock",
      ];

    if (
      !allowedActions.includes(
        action
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Ação inválida.",
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
      await supabase.rpc(
        "admin_manage_user",
        {
          p_user_id:
            userId,

          p_action:
            action,

          p_value:
            typeof value ===
            "number"
              ? value
              : null,

          p_timestamp:
            timestamp ||
            null,
        }
      );

    if (error) {
      console.error(
        "[ADMIN MANAGE]",
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

    revalidatePath(
      "/admin"
    );

    return NextResponse.json({
      success: true,

      user:
        Array.isArray(data)
          ? data[0]
          : data,
    });

  } catch (
    error
  ) {
    console.error(
      "[ADMIN MANAGE]",
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