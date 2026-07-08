import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getPedidoDetalhe, updatePedidoStatus, calcularFrete, gerarEtiqueta } from "@/lib/admin.functions";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [pedido, setPedido] = useState<any>(null);
  const [fretes, setFretes] = useState<any[] | null>(null);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const getD = useServerFn(getPedidoDetalhe);
  const upd = useServerFn(updatePedidoStatus);
  const calc = useServerFn(calcularFrete);
  const etiq = useServerFn(gerarEtiqueta);

  const load = () => getD({ data: { id } }).then(setPedido).catch((e) => toast.error(e.message));
  useEffect(() => { load(); /* eslint-disable-line */ }, [id]);

  if (!pedido) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const onCalc = async () => {
    if (!pedido.clientes?.cep) return toast.error("Cliente sem CEP.");
    setLoadingFrete(true);
    try {
      const r = await calc({ data: { pedido_id: id, cep_destino: pedido.clientes.cep } });
      setFretes(Array.isArray(r) ? r : []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingFrete(false); }
  };

  const onEtiqueta = async (service_id: number) => {
    try {
      await etiq({ data: { pedido_id: id, service_id } });
      toast.success("Etiqueta solicitada");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const changeStatus = async (field: "status_pagamento" | "status_logistica", v: string) => {
    try { await upd({ data: { id, [field]: v } as any }); toast.success("Atualizado"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/pedidos" className="text-xs uppercase tracking-[0.2em] text-muted-foreground story-link">← Voltar</Link>
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Pedido</p>
          <h1 className="font-serif text-3xl mt-1">#{pedido.numero}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-serif text-2xl">{formatPrice(Number(pedido.valor_total))}</p>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border p-5 bg-card space-y-2 text-sm">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Cliente</h2>
          <p className="font-medium">{pedido.clientes?.nome_completo ?? "—"}</p>
          <p className="text-muted-foreground">{pedido.clientes?.email}</p>
          <p className="text-muted-foreground">{pedido.clientes?.telefone}</p>
          <p className="text-muted-foreground text-xs">
            {[pedido.clientes?.rua, pedido.clientes?.numero, pedido.clientes?.bairro, pedido.clientes?.cidade, pedido.clientes?.uf, pedido.clientes?.cep].filter(Boolean).join(", ")}
          </p>
        </div>

        <div className="border border-border p-5 bg-card space-y-3 text-sm">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Status</h2>
          <label className="block">Pagamento
            <select value={pedido.status_pagamento} onChange={(e) => changeStatus("status_pagamento", e.target.value)} className="w-full border border-border p-2 mt-1 bg-background">
              <option value="pendente">Pendente</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option>
            </select>
          </label>
          <label className="block">Logística
            <select value={pedido.status_logistica} onChange={(e) => changeStatus("status_logistica", e.target.value)} className="w-full border border-border p-2 mt-1 bg-background">
              <option value="aguardando_envio">Aguardando envio</option>
              <option value="etiqueta_gerada">Etiqueta gerada</option>
              <option value="enviado">Enviado</option>
              <option value="entregue">Entregue</option>
            </select>
          </label>
          <p className="text-xs text-muted-foreground">Método: <strong>{pedido.metodo_pagamento}</strong></p>
        </div>
      </div>

      <div className="border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground">Itens</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
            <tr><th className="p-3">Produto</th><th>SKU</th><th className="text-right">Qtd</th><th className="text-right">Preço</th></tr>
          </thead>
          <tbody>
            {(pedido.itens_pedido ?? []).map((it: any) => (
              <tr key={it.id} className="border-t border-border">
                <td className="p-3">{it.produtos?.nome}</td>
                <td className="text-muted-foreground text-xs font-mono">{it.produtos?.sku}</td>
                <td className="text-right">{it.quantidade}</td>
                <td className="text-right">{formatPrice(Number(it.preco_unitario))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-border p-5 bg-card space-y-4">
        <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground">Logística (SuperFrete)</h2>
        {pedido.tracking_code && (
          <p className="text-sm">Código de rastreio: <code className="bg-secondary px-2 py-1 rounded">{pedido.tracking_code}</code></p>
        )}
        <div className="flex gap-2">
          <button onClick={onCalc} disabled={loadingFrete} className="px-4 py-2 border border-border text-xs uppercase tracking-[0.2em] disabled:opacity-50">
            {loadingFrete ? "Calculando…" : "Calcular frete"}
          </button>
        </div>
        {fretes && (
          <div className="space-y-2">
            {fretes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma opção retornada.</p>}
            {fretes.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{f.name ?? f.service_name ?? `Serviço ${f.id}`}</p>
                  <p className="text-xs text-muted-foreground">Entrega: {f.delivery_time ?? f.delivery_range?.min}–{f.delivery_range?.max ?? "?"} dias</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-serif">{f.price ? formatPrice(Number(f.price)) : "—"}</span>
                  <button onClick={() => onEtiqueta(f.id)} className="px-3 py-1.5 bg-foreground text-background text-xs uppercase tracking-[0.2em]">
                    Gerar etiqueta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
