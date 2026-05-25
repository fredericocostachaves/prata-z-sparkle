import { Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { getBestSellers } from "@/data/products";

export function MostLoved() {
  const products = getBestSellers();
  return (
    <section id="mais-amados" className="py-16 md:py-24 bg-background">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
