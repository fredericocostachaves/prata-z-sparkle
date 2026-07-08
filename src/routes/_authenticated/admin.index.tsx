import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { getDashboard } from "@/lib/admin.functions";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

const COLORS = ["#8b7355", "#c9a961"];

function DashboardPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboard>> | null>(null);
  const fetchDash = useServerFn(getDashboard);

  useEffect(() => { fetchDash().then(setData).catch(console.error); }, [fetchDash]);

  if (!data) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Painel</p>
        <h1 className="font-serif text-3xl mt-1">Dashboard</h1>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Faturamento no mês" value={formatPrice(data.kpi.faturamentoMes)} />
        <Kpi label="Ticket médio" value={formatPrice(data.kpi.ticketMedio)} />
        <Kpi label="Pedidos pagos (mês)" value={String(data.kpi.pedidosPagosMes)} />
        <Kpi label="Total de clientes" value={String(data.kpi.totalClientes)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border p-6 bg-card">
          <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">Faturamento diário (30d)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.evolucaoDiaria}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="data" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Line type="monotone" dataKey="total" stroke="#8b7355" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border p-6 bg-card">
          <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">Métodos de pagamento</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.pagamentos} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                  {data.pagamentos.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="border border-border p-6 bg-card">
        <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">Top 5 mais vendidos</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr><th className="py-2">#</th><th>Produto</th><th>SKU</th><th className="text-right">Unidades</th></tr>
          </thead>
          <tbody>
            {data.topProdutos.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sem vendas ainda.</td></tr>
            )}
            {data.topProdutos.map((p, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-3">{i + 1}</td>
                <td>{p.nome}</td>
                <td className="text-muted-foreground">{p.sku}</td>
                <td className="text-right font-medium">{p.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-5 bg-card">
      <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{label}</p>
      <p className="font-serif text-2xl mt-2">{value}</p>
    </div>
  );
}
