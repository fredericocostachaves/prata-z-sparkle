import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

const posts = [
  {
    slug: "como-cuidar-prata-925",
    title: "Como cuidar da sua prata 925 no dia a dia",
    excerpt: "Dicas simples para preservar o brilho e a beleza das suas joias por muitos anos.",
    date: "2026-04-15",
    category: "Cuidados",
  },
  {
    slug: "guia-presentes-joias",
    title: "Guia de presentes: a joia certa para cada ocasião",
    excerpt: "Aniversário, formatura, dia das mães — encontre a peça perfeita para cada momento.",
    date: "2026-03-28",
    category: "Inspiração",
  },
  {
    slug: "tendencias-2026",
    title: "Tendências de joias para 2026",
    excerpt: "Sobreposições, peças statement e o retorno do clássico atemporal.",
    date: "2026-02-10",
    category: "Tendências",
  },
  {
    slug: "historia-prata-z",
    title: "A história por trás da Prata Z",
    excerpt: "Conheça a paixão e o cuidado por trás de cada peça da nossa coleção.",
    date: "2026-01-05",
    category: "Sobre nós",
  },
];

export { posts };

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog Prata Z — Inspiração e cuidados em joias de prata 925" },
      { name: "description", content: "Inspiração, tendências e dicas de cuidado para suas joias em prata 925." },
      { property: "og:title", content: "Blog Prata Z Joias" },
      { property: "og:description", content: "Inspiração, tendências e cuidados com joias de prata 925." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <PageShell eyebrow="Blog" title="Inspiração & cuidados" subtitle="Histórias, tendências e dicas para você viver suas joias com mais brilho.">
      <section className="mx-auto max-w-5xl px-6 sm:px-10 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-10">
          {posts.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group block"
            >
              <div className="aspect-[4/3] bg-secondary img-zoom rounded-sm">
                <div className="h-full w-full bg-gradient-to-br from-nude-soft to-secondary flex items-center justify-center">
                  <span className="font-serif text-6xl text-nude-deep/40">Z</span>
                </div>
              </div>
              <p className="mt-5 text-[11px] tracking-[0.3em] uppercase text-nude-deep">{p.category}</p>
              <h2 className="mt-2 text-2xl font-serif text-foreground group-hover:text-nude-deep transition-colors">
                {p.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
              <span className="mt-4 inline-block story-link text-[11px] tracking-[0.3em] uppercase">
                Ler artigo
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
