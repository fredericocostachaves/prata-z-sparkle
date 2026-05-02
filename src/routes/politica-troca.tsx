import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/politica-troca")({
  head: () => ({
    meta: [
      { title: "Trocas e devoluções — Prata Z Joias" },
      { name: "description", content: "Política de trocas e devoluções da Prata Z Joias." },
    ],
  }),
  component: () => (
    <PageShell eyebrow="Políticas" title="Trocas e devoluções">
      <section className="mx-auto max-w-3xl px-6 sm:px-10 py-12 md:py-16 space-y-5 text-foreground/90 leading-relaxed">
        <p>Você tem até <strong>7 dias corridos</strong> a contar do recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.</p>
        <h2 className="text-2xl font-serif pt-4">Como solicitar</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Entre em contato pelo WhatsApp ou e-mail informando o número do pedido.</li>
          <li>Envie a peça com a embalagem original, sem sinais de uso.</li>
          <li>Após análise, faremos a troca ou estorno em até 7 dias úteis.</li>
        </ol>
        <h2 className="text-2xl font-serif pt-4">Garantia</h2>
        <p>Todas as peças têm garantia de 90 dias contra defeitos de fabricação e garantia vitalícia para troca de fechos e ajustes.</p>
      </section>
    </PageShell>
  ),
});
