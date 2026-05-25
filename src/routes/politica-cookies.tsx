import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/politica-cookies")({
  head: () => ({
    meta: [
      { title: "Política de cookies — Prata Z Joias" },
      { name: "description", content: "Saiba como a Prata Z Joias utiliza cookies para melhorar a sua experiência de navegação." },
      { property: "og:title", content: "Política de cookies — Prata Z Joias" },
      { property: "og:description", content: "Como utilizamos cookies e como você pode gerenciá-los." },
    ],
    links: [{ rel: "canonical", href: "/politica-cookies" }],
  }),
  component: () => (
    <PageShell eyebrow="Políticas" title="Política de cookies">
      <section className="mx-auto max-w-3xl px-6 sm:px-10 py-12 md:py-16 space-y-5 text-foreground/90 leading-relaxed">
        <p>
          Esta Política de Cookies explica o que são cookies, como a Prata Z Joias
          os utiliza no site e quais opções você tem para gerenciá-los. Ao
          continuar navegando, você concorda com o uso descrito abaixo, em
          conformidade com a LGPD (Lei nº 13.709/2018).
        </p>

        <h2 className="text-2xl font-serif pt-4">O que são cookies</h2>
        <p>
          Cookies são pequenos arquivos de texto armazenados no seu dispositivo
          quando você visita um site. Eles ajudam a manter a sua sessão, lembrar
          preferências e entender como o site é utilizado.
        </p>

        <h2 className="text-2xl font-serif pt-4">Tipos de cookies que utilizamos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Essenciais:</strong> necessários para o funcionamento do site,
            como manter itens na sacola, processar o checkout e lembrar seu login.
          </li>
          <li>
            <strong>Desempenho e analíticos:</strong> permitem entender como os
            visitantes interagem com o site, ajudando a melhorar a experiência.
          </li>
          <li>
            <strong>Funcionais:</strong> guardam preferências (idioma, favoritos,
            consentimento) para personalizar a navegação.
          </li>
          <li>
            <strong>Marketing:</strong> utilizados para apresentar conteúdos e
            ofertas relevantes dentro e fora do nosso site.
          </li>
        </ul>

        <h2 className="text-2xl font-serif pt-4">Como gerenciar os cookies</h2>
        <p>
          Você pode aceitar ou recusar o uso de cookies não essenciais por meio
          do banner exibido na primeira visita. A qualquer momento, é possível
          ajustar as permissões nas configurações do seu navegador (Chrome,
          Safari, Firefox, Edge), apagando os cookies já salvos ou bloqueando os
          futuros.
        </p>
        <p className="text-sm text-muted-foreground">
          Importante: ao desativar cookies essenciais, algumas funcionalidades
          do site, como sacola e checkout, podem deixar de funcionar
          corretamente.
        </p>

        <h2 className="text-2xl font-serif pt-4">Compartilhamento de dados</h2>
        <p>
          Alguns cookies podem ser fornecidos por parceiros confiáveis (como
          provedores de análise e meios de pagamento) exclusivamente para as
          finalidades descritas. Não vendemos seus dados pessoais.
        </p>

        <h2 className="text-2xl font-serif pt-4">Seus direitos</h2>
        <p>
          De acordo com a LGPD, você pode solicitar acesso, correção, exclusão
          ou portabilidade dos seus dados pelo e-mail{" "}
          <a href="mailto:contato@prataz.com.br" className="underline">
            contato@prataz.com.br
          </a>
          . Para mais detalhes sobre o tratamento de dados pessoais, consulte a
          nossa{" "}
          <Link to="/politica-privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>

        <h2 className="text-2xl font-serif pt-4">Atualizações</h2>
        <p>
          Esta política pode ser atualizada periodicamente. A data da última
          revisão está indicada abaixo.
        </p>
        <p className="text-sm text-muted-foreground">Última atualização: maio de 2026.</p>
      </section>
    </PageShell>
  ),
});
