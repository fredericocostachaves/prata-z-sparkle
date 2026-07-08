import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getClienteDetalhe } from "@/lib/admin.functions";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/_authenticated/admin/clientes/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const fetchD = useServerFn(getClienteDetalhe);

  useEffect(() => {
    fetchD({ data: { id } }).then(setData).catch((e) => toast.error(e.message));
  }, [id, fetchD]);

  if (!data?.cliente) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const c = data.cliente;

  return (
    <div className="space-y-6">
      <Link to="/admin/clientes" className="text-xs uppercase tracking-[0.2em] text-muted-foreground story-link">← Voltar</Link>
      <header>
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Cliente</p>
        <h1 className="font-serif text-3xl mt-1">{c.nome_completo}</h1>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="border border-border p-5 bg-card">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">LTV</p>
          <p className="font-serif text-2xl mt-2">{formatPrice(data.ltv)}</p>
        </div>
        <div className="border border-border p-5 bg-card">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Última compra</p>
          <p className="font-serif text-lg mt-2">
            {data.ultimaCompra ? new Date(data.ultimaCompra).toLocaleDateString("pt-BR") : "—"}
          </p>
        </div>
        <div className="border border-border p-5 bg-card">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Total de pedidos</p>
          <p className="font-serif text-2xl mt-2">{data.pedidos.length}</p>
        </div>
      </div>

      <div className="border border-border p-6 bg-card">
        <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-3">Contato</h2>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted-foreground">E-mail</dt><dd>{c.email ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Telefone</dt><dd>{c.telefone ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">CPF/CNPJ</dt><dd>{c.cpf_cnpj ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Endereço</dt><dd>{[c.rua, c.numero, c.bairro, c.cidade, c.uf, c.cep].filter(Boolean).join(", ") || "—"}</dd></div>
        </dl>
      </div>

      <div className="border border-border overflow-x-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground">Histórico de pedidos</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
            <tr><th className="p-3">#</th><th>Data</th><th>Status</th><th>Método</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody>
            {data.pedidos.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  <Link to="/admin/pedidos/$id" params={{ id: p.id }} className="story-link">#{p.numero}</Link>
                </td>
                <td>{new Date(p.data_compra).toLocaleDateString("pt-BR")}</td>
                <td><StatusPill s={p.status_pagamento} /></td>
                <td>{p.metodo_pagamento}</td>
                <td className="text-right">{formatPrice(Number(p.valor_total))}</td>
              </tr>
            ))}
            {data.pedidos.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum pedido.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ s }: { s: string }) {
  const colors: Record<string, string> = {
    pago: "bg-green-100 text-green-800",
    pendente: "bg-amber-100 text-amber-800",
    cancelado: "bg-red-100 text-red-800",
  };
  return <span className={`px-2 py-1 rounded text-xs ${colors[s] ?? "bg-secondary"}`}>{s}</span>;
}
