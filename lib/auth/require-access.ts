import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AccessStatus {
  user_id: string;
  role: "user" | "admin";
  status: "active" | "blocked";
  access_until: string | null;
  server_now: string;
  has_access: boolean;
  days_remaining: number;
  max_screens: number;
  plan_name: string;
}

export async function requireAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_my_access_status"
  );

  if (error) {
    console.error(
      "Erro consultando acesso:",
      error
    );

    redirect("/acesso?motivo=erro");
  }

  const access =
    Array.isArray(data)
      ? data[0]
      : null;

  if (!access) {
    redirect(
      "/acesso?motivo=sem-perfil"
    );
  }

  if (!access.has_access) {
    if (
      access.status === "blocked"
    ) {
      redirect(
        "/acesso?motivo=bloqueado"
      );
    }

    if (
      access.access_until === null
    ) {
      redirect(
        "/acesso?motivo=aguardando"
      );
    }

    redirect(
      "/acesso?motivo=expirado"
    );
  }

  return {
    user,
    access:
      access as AccessStatus,
  };
}