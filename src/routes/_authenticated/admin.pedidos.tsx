import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listPedidos } from "@/lib/admin.functions";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const list = useServerFn(listPedidos);
  useEffect(() => { list().then(setRows).catch((e) => toast.error(e.message)); }, [list]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Vendas</p>
        <h1 className="font-serif text-3xl mt-1">Pedidos</h1>
      </header>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
            <tr>
              <th className="p-3">#</th><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Logística</th><th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3">
                  <Link to="/admin/pedidos/$id" params={{ id: p.id }} className="story-link font-medium">#{p.numero}</Link>
                </td>
                <td>{new Date(p.data_compra).toLocaleDateString("pt-BR")}</td>
                <td>{p.clientes?.nome_completo ?? "—"}</td>
                <td><Pill v={p.status_pagamento} /> <span className="text-xs text-muted-foreground">{p.metodo_pagamento}</span></td>
                <td><Pill v={p.status_logistica} /></td>
                <td className="text-right">{formatPrice(Number(p.valor_total))}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pill({ v }: { v: string }) {
  const c: Record<string, string> = {
    pago: "bg-green-100 text-green-800",
    pendente: "bg-amber-100 text-amber-800",
    cancelado: "bg-red-100 text-red-800",
    aguardando_envio: "bg-amber-100 text-amber-800",
    etiqueta_gerada: "bg-blue-100 text-blue-800",
    enviado: "bg-indigo-100 text-indigo-800",
    entregue: "bg-green-100 text-green-800",
  };
  return <span className={`px-2 py-1 rounded text-xs ${c[v] ?? "bg-secondary"}`}>{v.replace(/_/g, " ")}</span>;
}
