import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Award, Sparkles, RotateCcw } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/autenticidade")({
  head: () => ({
    meta: [
      { title: "Garantia de autenticidade — Prata 925 Prata Z" },
      { name: "description", content: "Todas as peças Prata Z são em prata esterlina 925 com selo de autenticidade e garantia vitalícia." },
      { property: "og:title", content: "Garantia 925 — Prata Z Joias" },
      { property: "og:description", content: "Selo de autenticidade, prata esterlina 925 e garantia vitalícia." },
    ],
  }),
  component: AutenticidadePage,
});

const items = [
  { icon: Award, title: "Selo 925", desc: "Cada peça leva o selo oficial 925 que comprova a pureza da prata esterlina." },
  { icon: ShieldCheck, title: "Certificado", desc: "Acompanha certificado de origem e laudo de autenticidade." },
  { icon: Sparkles, title: "Acabamento premium", desc: "Polimento manual e revisão peça a peça antes do envio." },
  { icon: RotateCcw, title: "Garantia vitalícia", desc: "Troca de fechos e ajustes sem custo enquanto a peça existir." },
];

function AutenticidadePage() {
  return (
    <PageShell eyebrow="Garantia" title="Autenticidade que você sente na mão" subtitle="Tudo o que você precisa saber sobre a nossa garantia em prata 925.">
      <section className="mx-auto max-w-5xl px-6 sm:px-10 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 gap-8">
          {items.map((it) => (
            <div key={it.title} className="border border-border p-8">
              <it.icon className="h-6 w-6 text-nude-deep" strokeWidth={1.5} />
              <h3 className="mt-4 text-xl font-serif text-foreground">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 space-y-6 text-foreground/90 leading-relaxed">
          <h2 className="text-2xl font-serif">Como cuidar da sua prata</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Evite contato com perfumes, cremes, água do mar e cloro.</li>
            <li>Guarde em local seco, preferencialmente no saquinho protetor que acompanha a peça.</li>
            <li>Limpe com flanela específica para prata sempre que necessário.</li>
            <li>Em manchas mais difíceis, conte com nosso serviço de polimento profissional.</li>
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
