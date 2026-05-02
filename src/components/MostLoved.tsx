import { Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { getBestSellers } from "@/data/products";
import catColar from "@/assets/cat-colar.jpg";
import catBrinco from "@/assets/cat-brinco.jpg";
import catAnel from "@/assets/cat-anel.jpg";
import catPulseira from "@/assets/cat-pulseira.jpg";

const editorialBoxes = [
  {
    title: "Colares",
    subtitle: "Camadas que contam histórias",
    image: catColar,
    slug: "colares",
  },
  {
    title: "Brincos",
    subtitle: "Do clássico ao statement",
    image: catBrinco,
    slug: "brincos",
  },
  {
    title: "Anéis",
    subtitle: "Solitários e delicadezas",
    image: catAnel,
    slug: "aneis",
  },
  {
    title: "Pulseiras",
    subtitle: "Brilho que acompanha o gesto",
    image: catPulseira,
    slug: "pulseiras",
  },
] as const;

export function MostLoved() {
  const products = getBestSellers();
  return (
    <section id="mais-amados" className="py-24 md:py-32 bg-background">
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

        {/* Editorial boxes */}
        <div className="mt-20 md:mt-28 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {editorialBoxes.map((box, i) => (
            <Link
              key={box.slug}
              to="/categoria/$slug"
              params={{ slug: box.slug }}
              className="group relative block aspect-[4/5] overflow-hidden rounded-sm reveal"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <img
                src={box.image}
                alt={box.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-background">
                <p className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase opacity-90">
                  {box.subtitle}
                </p>
                <h3 className="mt-2 text-2xl md:text-3xl font-serif">{box.title}</h3>
                <span className="mt-3 inline-block text-[11px] tracking-[0.3em] uppercase border-b border-background/70 pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explorar
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
