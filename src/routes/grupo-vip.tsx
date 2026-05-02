import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/grupo-vip")({
  head: () => ({
    meta: [
      { title: "Grupo VIP WhatsApp — Prata Z Joias" },
      { name: "description", content: "Entre para a comunidade VIP da Prata Z e receba lançamentos antecipados, descontos exclusivos e curadoria personalizada." },
      { property: "og:title", content: "Grupo VIP WhatsApp Prata Z" },
      { property: "og:description", content: "Lançamentos antecipados, descontos e curadoria exclusiva." },
    ],
  }),
  component: VipPage,
});

function VipPage() {
  return (
    <PageShell eyebrow="Comunidade exclusiva" title="Grupo VIP no WhatsApp" subtitle="Lançamentos antecipados, descontos exclusivos, sorteios e curadoria especial — antes de qualquer outro lugar.">
      <section className="mx-auto max-w-3xl px-6 sm:px-10 py-12 md:py-16 text-center">
        <a
          href="https://chat.whatsapp.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 text-[13px] tracking-[0.2em] uppercase hover:bg-cta transition-all hover:shadow-elegant"
        >
          Quero entrar no grupo VIP
        </a>

        <div className="mt-16 grid grid-cols-3 gap-6 text-left">
          {[
            { n: "01", t: "Lançamentos", d: "Acesso 48h antes do site" },
            { n: "02", t: "Descontos", d: "Cupons exclusivos do grupo" },
            { n: "03", t: "Curadoria", d: "Sugestões para o seu estilo" },
          ].map((b) => (
            <div key={b.n} className="border-t border-border pt-5">
              <p className="text-[11px] tracking-[0.3em] text-nude-deep">{b.n}</p>
              <p className="mt-3 text-sm font-medium text-foreground">{b.t}</p>
              <p className="text-xs text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
