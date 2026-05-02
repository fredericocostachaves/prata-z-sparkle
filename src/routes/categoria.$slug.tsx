import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { categories, getCategory, getProductsByCategory } from "@/data/products";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => {
    const cat = getCategory(params.slug);
    const title = cat
      ? `${cat.name} em prata 925 — Prata Z Joias`
      : "Categoria — Prata Z Joias";
    const desc = cat
      ? `${cat.description}. Alta joalheria em prata 925 com atendimento personalizado.`
      : "Catálogo Prata Z Joias.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: CategoryPage,
});

type Sort = "destaques" | "menor" | "maior" | "novos";

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = getCategory(slug);
  const all = getProductsByCategory(slug);
  const [sort, setSort] = useState<Sort>("destaques");

  const list = useMemo(() => {
    const arr = [...all];
    if (sort === "menor") arr.sort((a, b) => a.price - b.price);
    if (sort === "maior") arr.sort((a, b) => b.price - a.price);
    if (sort === "novos") arr.sort((a, b) => Number(b.isNew ?? 0) - Number(a.isNew ?? 0));
    return arr;
  }, [all, sort]);

  if (!cat) {
    return (
      <PageShell eyebrow="Catálogo" title="Categoria não encontrada">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-muted-foreground">Esta categoria não existe.</p>
          <Link to="/" className="mt-6 inline-block story-link text-[12px] tracking-[0.3em] uppercase">
            Voltar para a home
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Catálogo" title={cat.name} subtitle={cat.description}>
      <section className="mx-auto max-w-7xl px-6 sm:px-10 py-12 md:py-16">
        {/* Filter row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <p className="text-sm text-muted-foreground">
            {list.length} {list.length === 1 ? "peça" : "peças"}
          </p>
          <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase">
            <label htmlFor="sort">Ordenar:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="destaques">Destaques</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="novos">Lançamentos</option>
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Em breve novidades nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        {/* Other categories */}
        <div className="mt-24 border-t border-border pt-12">
          <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep text-center">
            Continue explorando
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {categories
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  to="/categoria/$slug"
                  params={{ slug: c.slug }}
                  className="border border-border px-5 py-2 text-[11px] tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
