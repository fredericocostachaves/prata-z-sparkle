import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Truck, Package, Clock } from "lucide-react";

export const Route = createFileRoute("/entrega")({
  head: () => ({
    meta: [
      { title: "Entrega e frete — Prata Z Joias" },
      { name: "description", content: "Tudo sobre prazos, fretes e entregas da Prata Z Joias para todo o Brasil." },
    ],
  }),
  component: EntregaPage,
});

function EntregaPage() {
  return (
    <PageShell eyebrow="Entrega" title="Envio para todo o Brasil" subtitle="Embalagem premium, rastreio e cuidado do começo ao fim.">
      <section className="mx-auto max-w-4xl px-6 sm:px-10 py-12 md:py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Truck, t: "Frete grátis", d: "Acima de R$ 299 para todo o Brasil." },
            { icon: Clock, t: "Prazo", d: "1 a 7 dias úteis após postagem." },
            { icon: Package, t: "Embalagem premium", d: "Caixa rígida, pronta para presentear." },
          ].map((it) => (
            <div key={it.t} className="border border-border p-6 text-center">
              <it.icon className="h-6 w-6 mx-auto text-nude-deep" strokeWidth={1.5} />
              <h3 className="mt-3 font-serif text-xl">{it.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 space-y-5 text-foreground/90 leading-relaxed">
          <h2 className="text-2xl font-serif">Como funciona</h2>
          <p>Após a confirmação do pagamento, separamos sua peça com cuidado e enviamos em até <strong>2 dias úteis</strong>. Você recebe o código de rastreio por e-mail e WhatsApp.</p>
          <p>Trabalhamos com Correios (PAC e SEDEX) e transportadoras privadas para garantir segurança em cada entrega.</p>
        </div>
      </section>
    </PageShell>
  );
}
