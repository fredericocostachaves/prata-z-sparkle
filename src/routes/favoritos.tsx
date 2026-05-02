import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useFavorites } from "@/contexts/FavoritesContext";
import { products } from "@/data/products";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Prata Z Joias" },
      { name: "description", content: "Suas joias favoritas na Prata Z." },
    ],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  const fav = useFavorites();
  const list = products.filter((p) => fav.has(p.id));

  if (list.length === 0) {
    return (
      <PageShell eyebrow="Favoritos" title="Nenhum favorito por aqui">
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <Heart className="h-12 w-12 mx-auto text-nude-deep" strokeWidth={1} />
          <p className="mt-6 text-muted-foreground">Salve as peças que você ama para encontrá-las depois.</p>
          <Link to="/" className="mt-6 inline-block bg-cta text-cta-foreground px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition">
            Explorar coleção
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Favoritos" title="Suas peças favoritas">
      <section className="mx-auto max-w-7xl px-6 sm:px-10 py-12 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
