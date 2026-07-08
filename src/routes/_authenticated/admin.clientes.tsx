import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listClientes } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const list = useServerFn(listClientes);
  useEffect(() => { list().then(setRows).catch((e) => toast.error(e.message)); }, [list]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">CRM</p>
        <h1 className="font-serif text-3xl mt-1">Clientes</h1>
      </header>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
            <tr><th className="p-3">Nome</th><th>E-mail</th><th>Telefone</th><th>Cidade/UF</th><th>Tags</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3">
                  <Link to="/admin/clientes/$id" params={{ id: c.id }} className="story-link font-medium">
                    {c.nome_completo}
                  </Link>
                </td>
                <td>{c.email ?? "—"}</td>
                <td>{c.telefone ?? "—"}</td>
                <td className="text-muted-foreground">{[c.cidade, c.uf].filter(Boolean).join("/") || "—"}</td>
                <td className="text-xs text-muted-foreground">{(c.tags ?? []).join(", ")}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum cliente cadastrado ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
