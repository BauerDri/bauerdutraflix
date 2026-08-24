import {
    redirect,
  } from "next/navigation";
  
  import Navbar from "@/components/Navbar";
  
  import AdminDashboard, {
    type AdminUser,
  } from "./AdminDashboard";
  
  import {
    createClient,
  } from "@/lib/supabase/server";
  
  import styles from "./admin.module.css";
  
  export default async function AdminPage() {
    const supabase =
      await createClient();
  
    /*
     * =========================================================
     * VALIDA ADMIN
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
  
    if (!user) {
      redirect(
        "/login"
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
      redirect("/");
    }
  
    /*
     * =========================================================
     * USUÁRIOS
     * =========================================================
     */
  
    const {
      data,
      error,
    } =
      await supabase.rpc(
        "admin_list_users"
      );
  
    if (error) {
      console.error(
        "[ADMIN]",
        error
      );
    }
  
    const users =
      (
        data ||
        []
      ) as AdminUser[];
  
    return (
      <main
        className={
          styles.page
        }
      >
        <Navbar />
  
        <section
          className={
            styles.shell
          }
        >
          <header
            className={
              styles.header
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                BauerDutraFlix
              </span>
  
              <h1>
                Administração
              </h1>
  
              <p>
                Gestão de usuários,
                assinaturas, telas
                e conexões.
              </p>
            </div>
  
            <div
              className={
                styles.serverBadge
              }
            >
              <span />
  
              Sistema online
            </div>
          </header>
  
          {error && (
            <div
              className={
                styles.error
              }
            >
              Erro carregando
              usuários.
  
              <small>
                {
                  error.message
                }
              </small>
            </div>
          )}
  
          <AdminDashboard
            initialUsers={
              users
            }
          />
        </section>
      </main>
    );
  }