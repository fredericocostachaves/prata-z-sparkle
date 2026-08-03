import { useMemo, useRef } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/data/products";

import type { BestSellersResult, CatalogProduct } from "@/lib/catalog.types";
import catFallback from "@/assets/cat-colar.jpg";

const routeApi = getRouteApi("/");

function toProduct(p: CatalogProduct): Product {
  const slug = `${p.sku}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const images = [p.image, ...(p.gallery ?? [])].filter(Boolean) as string[];
  return {
    id: p.id,
    slug: slug || p.id,
    name: p.name,
    category: p.category as Product["category"],
    price: p.price,
    images: images.length ? images : [catFallback],
    description: p.description ?? "",
    highlights: [],
    stock: p.stock,
  };
}

export function MostLoved() {
  const data = routeApi.useLoaderData() as BestSellersResult;
  const groups = data?.groups ?? [];
  const trackRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const all: Product[] = [];
    const seen = new Set<string>();
    // intercala produtos das categorias para variedade visual
    const max = Math.max(0, ...groups.map((g) => g.products.length));
    for (let i = 0; i < max; i++) {
      for (const g of groups) {
        const p = g.products[i];
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          all.push(toProduct(p));
        }
      }
    }
    return all;
  }, [groups]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section id="mais-amados" className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="mb-8 md:mb-10 max-w-2xl">
          <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Top de vendas</p>
          <h2 className="mt-4 text-4xl md:text-5xl text-foreground">
            Os mais amados <em className="text-nude-deep not-italic font-serif italic">pelas prateadas</em>
          </h2>
        </div>


        <div className="relative">
          <div
            ref={trackRef}
            className="flex gap-5 md:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((p, i) => (
              <div key={p.id} className="snap-start shrink-0 w-[calc(50%-10px)] lg:w-[calc(25%-24px)]">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>

          {items.length > 2 && (
            <>
              <button
                aria-label="Anterior"
                onClick={() => scrollBy(-1)}
                className="hidden md:flex absolute -left-4 top-1/3 h-10 w-10 items-center justify-center rounded-full bg-background/90 border border-border hover:text-nude-deep transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Próximo"
                onClick={() => scrollBy(1)}
                className="hidden md:flex absolute -right-4 top-1/3 h-10 w-10 items-center justify-center rounded-full bg-background/90 border border-border hover:text-nude-deep transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
