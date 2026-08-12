import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ProductCard } from "@/components/ProductCard";
import { getBestSellers, type Product } from "@/data/products";
import { listTopSellers } from "@/lib/catalog.functions";
import type { CatalogProduct } from "@/lib/catalog.types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import catFallback from "@/assets/cat-colar.jpg";

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
  const fetchTop = useServerFn(listTopSellers);
  const { data } = useQuery({
    queryKey: ["top-vendas"],
    queryFn: () => fetchTop(),
    staleTime: 60_000,
    retry: 1,
  });

  const products = useMemo(() => {
    const remote = data?.products ?? [];
    return remote.length ? remote.map(toProduct) : getBestSellers();
  }, [data]);

  return (
    <section id="mais-amados" className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 md:mb-20 gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Top de vendas</p>
            <h2 className="mt-4 text-4xl md:text-5xl text-foreground">
              Os mais amados <em className="text-nude-deep not-italic font-serif italic">pelas prateadas</em>
            </h2>
          </div>
          <Link
            to="/categoria/$slug"
            params={{ slug: "colares" }}
            className="story-link text-[12px] tracking-[0.3em] uppercase text-foreground self-start md:self-end"
          >
            Ver coleção completa
          </Link>
        </div>

        <Carousel opts={{ align: "start", loop: products.length > 4 }} className="relative">
          <CarouselContent className="-ml-5 md:-ml-8">
            {products.map((p, i) => (
              <CarouselItem key={p.id} className="pl-5 md:pl-8 basis-1/2 lg:basis-1/4">
                <ProductCard product={p} index={i} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </div>
    </section>
  );
}
