import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getMyRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");
  const fetchRole = useServerFn(getMyRole);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRole()
      .then((r) => {
        if (r.isAdmin || r.isStaff) setStatus("ok");
        else setStatus("denied");
      })
      .catch(() => setStatus("denied"));
  }, [fetchRole]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Verificando permissões…
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Acesso restrito</p>
        <h1 className="font-serif text-3xl">Somente administradores</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Sua conta não tem permissão para acessar o backoffice. Faça login com o e-mail
          administrador cadastrado.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase"
        >
          Voltar para a loja
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
