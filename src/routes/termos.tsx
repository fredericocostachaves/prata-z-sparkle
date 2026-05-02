import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Prata Z Joias" },
      { name: "description", content: "Termos de uso da loja Prata Z Joias." },
    ],
  }),
  component: () => (
    <PageShell eyebrow="Políticas" title="Termos de uso">
      <section className="mx-auto max-w-3xl px-6 sm:px-10 py-12 md:py-16 space-y-5 text-foreground/90 leading-relaxed">
        <p>Ao acessar e utilizar o site da Prata Z, você concorda com os termos descritos abaixo.</p>
        <h2 className="text-2xl font-serif pt-4">Uso do site</h2>
        <p>O conteúdo do site, incluindo imagens, textos e marca, é de propriedade da Prata Z e protegido por direitos autorais.</p>
        <h2 className="text-2xl font-serif pt-4">Pedidos e pagamentos</h2>
        <p>Os pedidos só são confirmados após aprovação do pagamento. Reservamo-nos o direito de cancelar pedidos com indícios de fraude.</p>
        <h2 className="text-2xl font-serif pt-4">Alterações</h2>
        <p>Estes termos podem ser atualizados a qualquer momento. A versão vigente é sempre a publicada no site.</p>
      </section>
    </PageShell>
  ),
});
