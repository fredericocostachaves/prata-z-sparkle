import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { posts } from "./blog";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = posts.find((p) => p.slug === params.slug);
    const title = post ? `${post.title} — Blog Prata Z` : "Artigo — Blog Prata Z";
    const desc = post?.excerpt ?? "Artigo do blog Prata Z Joias.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <PageShell eyebrow="Blog" title="Artigo não encontrado">
        <div className="text-center py-16">
          <Link to="/blog" className="story-link text-[12px] tracking-[0.3em] uppercase">
            Voltar ao blog
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell hideHero>
      <article className="mx-auto max-w-3xl px-6 sm:px-10 py-16 md:py-20">
        <Link to="/blog" className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">
          ← Blog
        </Link>
        <p className="mt-8 text-[11px] tracking-[0.3em] uppercase text-nude-deep">{post.category}</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-serif text-foreground">{post.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {new Date(post.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <div className="mt-10 aspect-[16/9] bg-gradient-to-br from-nude-soft to-secondary rounded-sm flex items-center justify-center">
          <span className="font-serif text-8xl text-nude-deep/40">Z</span>
        </div>

        <div className="mt-10 prose prose-neutral max-w-none space-y-6 text-foreground/90 leading-relaxed">
          <p className="text-lg">{post.excerpt}</p>
          <p>
            Em cada peça da Prata Z, há uma história de cuidado, técnica e amor pelo detalhe.
            Nossa proposta é entregar joias que acompanhem você todos os dias — sejam os
            momentos especiais, sejam os pequenos gestos que fazem a vida mais bonita.
          </p>
          <p>
            A prata 925 é uma das ligas mais nobres da joalheria, composta por 92,5% de prata
            pura e 7,5% de outros metais para garantir resistência. Com os cuidados certos,
            ela mantém o brilho e a elegância por gerações.
          </p>
          <h2 className="text-2xl font-serif">Dicas práticas</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Guarde suas joias em local seco, longe da umidade.</li>
            <li>Evite contato com perfumes, cremes e produtos de limpeza.</li>
            <li>Limpe periodicamente com flanela específica para prata.</li>
            <li>Use uma joia por vez ao se exercitar ou tomar banho.</li>
          </ul>
          <p>
            Quando precisar de um polimento mais profundo, o nosso showroom oferece serviço
            de manutenção e restauração — agende sua visita.
          </p>
        </div>

        <div className="mt-16 border-t border-border pt-10 text-center">
          <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Continue lendo</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {posts
              .filter((p) => p.slug !== slug)
              .slice(0, 3)
              .map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="border border-border px-5 py-2 text-[11px] tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition"
                >
                  {p.title}
                </Link>
              ))}
          </div>
        </div>
      </article>
    </PageShell>
  );
}
