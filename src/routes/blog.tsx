import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { posts, categories, getFeaturedPost, formatDate } from "@/data/blog";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog Prata Z — Inspiração e cuidados em joias de prata 925" },
      {
        name: "description",
        content:
          "Inspiração, tendências e dicas de cuidado para suas joias em prata 925. Conteúdo da Prata Z Joias sobre alta joalheria em prata.",
      },
      { property: "og:title", content: "Blog Prata Z Joias" },
      {
        property: "og:description",
        content: "Inspiração, tendências e cuidados com joias de prata 925.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const [active, setActive] = useState<string>("Todas");
  const featured = getFeaturedPost();

  const filtered = useMemo(
    () =>
      posts
        .filter((p) => active === "Todas" || p.category === active)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [active],
  );

  return (
    <PageShell hideHero>
      {/* 1. Hero banner do artigo em destaque */}
      <section className="mx-auto max-w-7xl px-6 sm:px-10 pt-10 md:pt-14">
        <div className="grid lg:grid-cols-2 overflow-hidden rounded-lg bg-secondary/50">
          <div className="order-2 lg:order-1 p-8 sm:p-12 flex flex-col justify-center">
            <span className="self-start rounded-full bg-nude-deep px-4 py-1.5 text-[10px] tracking-[0.25em] uppercase text-background">
              {featured.category}
            </span>
            <h1 className="mt-6 font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-foreground">
              {featured.title}
            </h1>
            <p className="mt-5 text-muted-foreground max-w-lg">{featured.excerpt}</p>
            <div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" /> {formatDate(featured.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> {featured.readTime} min de leitura
              </span>
            </div>
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="mt-8 inline-flex items-center gap-3 self-start bg-cta text-cta-foreground px-8 py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition-all hover:shadow-elegant"
            >
              Ler artigo completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="order-1 lg:order-2 relative min-h-[260px] lg:min-h-[460px]">
            <img
              src={featured.cover}
              alt={featured.title}
              width={1200}
              height={900}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Marcas / categorias (filtro) */}
      <section className="mx-auto max-w-7xl px-6 sm:px-10 pt-14 md:pt-20">
        <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep text-center">
          Navegue por tema
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {["Todas", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              aria-pressed={active === c}
              className={`border px-5 py-2 text-[11px] tracking-[0.2em] uppercase transition ${
                active === c
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-foreground hover:border-nude-deep hover:text-nude-deep"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Grid de posts */}
      <section className="mx-auto max-w-7xl px-6 sm:px-10 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, idx) => (
            <article key={p.slug}>
              <Link to="/blog/$slug" params={{ slug: p.slug }} className="group block">
                <div className="overflow-hidden rounded-lg bg-secondary aspect-[4/3]">
                  <img
                    src={p.cover}
                    alt={p.title}
                    width={800}
                    height={600}
                    loading={idx < 3 ? "eager" : "lazy"}
                    decoding="async"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <span className="mt-5 inline-block rounded-full bg-nude-soft px-3 py-1 text-[10px] tracking-[0.25em] uppercase text-nude-deep">
                  {p.category}
                </span>
                <h3 className="mt-3 font-serif text-2xl text-foreground group-hover:text-nude-deep transition-colors">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDate(p.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {p.readTime} min
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            Nenhum artigo nesta categoria por enquanto.
          </p>
        )}
      </section>
    </PageShell>
  );
}
