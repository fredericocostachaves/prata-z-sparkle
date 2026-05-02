import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Prata Z Joias" },
      { name: "description", content: "Acesse seus pedidos, dados e endereços na Prata Z." },
    ],
  }),
  component: ContaLayout,
});

function ContaLayout() {
  return (
    <PageShell eyebrow="Minha conta" title="Olá!">
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-12 md:py-16 grid lg:grid-cols-[220px_1fr] gap-12">
        <nav className="flex lg:flex-col gap-2 text-sm">
          <Link to="/conta/pedidos" activeProps={{ className: "font-medium text-foreground" }} className="px-4 py-3 border-l-2 border-transparent hover:border-nude-deep">
            Meus pedidos
          </Link>
          <Link to="/conta/dados" activeProps={{ className: "font-medium text-foreground" }} className="px-4 py-3 border-l-2 border-transparent hover:border-nude-deep">
            Meus dados
          </Link>
          <Link to="/conta/enderecos" activeProps={{ className: "font-medium text-foreground" }} className="px-4 py-3 border-l-2 border-transparent hover:border-nude-deep">
            Endereços
          </Link>
          <Link to="/" className="px-4 py-3 text-muted-foreground hover:text-foreground">
            Sair
          </Link>
        </nav>
        <div>
          <Outlet />
        </div>
      </section>
    </PageShell>
  );
}
