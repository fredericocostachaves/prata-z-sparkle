import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a Prata Z — Alta joalheria em prata 925" },
      { name: "description", content: "Conheça a Prata Z: alta joalheria em prata 925 com atendimento personalizado e peças que celebram momentos." },
      { property: "og:title", content: "Sobre a Prata Z" },
      { property: "og:description", content: "Atendimento personalizado de joias e peças exclusivas em prata 925." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <PageShell eyebrow="Quem somos" title="Sobre a Prata Z" subtitle="Joias que contam histórias, feitas para acompanhar a sua.">
      <section className="mx-auto max-w-3xl px-6 sm:px-10 py-12 md:py-16 space-y-6 text-foreground/90 leading-relaxed">
        <p className="text-lg">
          A Prata Z nasceu do desejo de unir alta joalheria, atendimento humano e uma
          experiência de compra à altura das mulheres que celebramos.
        </p>
        <p>
          Trabalhamos exclusivamente com prata esterlina 925 — selecionada peça a peça,
          com selo de autenticidade e garantia vitalícia de troca de fechos e ajustes.
          Cada coleção é pensada para combinar com o seu estilo de vida: do dia a dia
          aos momentos mais especiais.
        </p>
        <p>
          Mais do que joias, oferecemos cuidado: do nosso atendimento individual no
          showroom à embalagem que você abre em casa, tudo é desenhado para reforçar o
          seu empoderamento e a exclusividade que você merece.
        </p>
        <h2 className="text-2xl font-serif pt-4">Nossos pilares</h2>
        <ul className="space-y-3 list-disc pl-6">
          <li><strong>Autenticidade:</strong> 100% prata 925 com selo de garantia.</li>
          <li><strong>Cuidado:</strong> embalagens exclusivas e atendimento individual.</li>
          <li><strong>Estilo:</strong> coleções atemporais e peças statement.</li>
          <li><strong>Confiança:</strong> garantia vitalícia e suporte pós-venda.</li>
        </ul>
      </section>
    </PageShell>
  );
}
