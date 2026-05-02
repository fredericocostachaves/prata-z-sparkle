import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { searchProducts } from "@/data/products";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/busca")({
  validateSearch: (search) => searchSchema.parse(search),
  head: ({ search }) => ({
    meta: [
      { title: `Busca: ${search.q || ""} — Prata Z Joias` },
      { name: "description", content: "Resultados da busca no catálogo Prata Z Joias." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const results = searchProducts(q);

  return (
    <PageShell
      eyebrow="Busca"
      title={q ? `Resultados para "${q}"` : "Busque no catálogo"}
      subtitle={q ? `${results.length} ${results.length === 1 ? "peça encontrada" : "peças encontradas"}` : "Use a barra de busca no topo do site."}
    >
      <section className="mx-auto max-w-7xl px-6 sm:px-10 py-12 md:py-16">
        {results.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            {q ? "Nenhuma peça encontrada. Tente outra palavra-chave." : ""}
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8">
            {results.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
