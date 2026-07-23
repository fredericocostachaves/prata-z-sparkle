import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Users, Building2, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/produtos", label: "Produtos (Estoque)", icon: Package },
  { to: "/admin/clientes", label: "Clientes (CRM)", icon: Users },
  { to: "/admin/fornecedores", label: "Fornecedores", icon: Building2 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-background min-h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Prata Z</p>
        <h1 className="font-serif text-xl mt-1">Backoffice</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.to, "exact" in it && it.exact);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition ${
                active ? "bg-foreground text-background" : "hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="m-3 flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-secondary text-muted-foreground"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </aside>
  );
}
