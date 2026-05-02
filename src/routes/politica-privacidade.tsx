import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/politica-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — Prata Z Joias" },
      { name: "description", content: "Política de privacidade e tratamento de dados da Prata Z Joias." },
    ],
  }),
  component: () => (
    <PageShell eyebrow="Políticas" title="Política de privacidade">
      <section className="mx-auto max-w-3xl px-6 sm:px-10 py-12 md:py-16 space-y-5 text-foreground/90 leading-relaxed">
        <p>A Prata Z respeita a sua privacidade e está comprometida com a proteção dos seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).</p>
        <h2 className="text-2xl font-serif pt-4">Dados coletados</h2>
        <p>Coletamos apenas as informações necessárias para processar seu pedido, garantir a entrega e melhorar a sua experiência.</p>
        <h2 className="text-2xl font-serif pt-4">Como usamos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Processar pedidos e pagamentos.</li>
          <li>Realizar a entrega e o pós-venda.</li>
          <li>Enviar comunicações relevantes (apenas com sua autorização).</li>
        </ul>
        <h2 className="text-2xl font-serif pt-4">Seus direitos</h2>
        <p>Você pode solicitar a qualquer momento o acesso, correção ou exclusão dos seus dados pelo e-mail contato@prataz.com.br.</p>
      </section>
    </PageShell>
  ),
});
