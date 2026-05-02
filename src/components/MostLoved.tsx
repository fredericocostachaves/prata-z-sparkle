import { Heart } from "lucide-react";
import p1 from "@/assets/prod-1.jpg";
import p2 from "@/assets/prod-2.jpg";
import p3 from "@/assets/prod-3.jpg";
import p4 from "@/assets/prod-4.jpg";

const products = [
  { name: "Colar Coração Eterno", price: "R$ 189,00", parc: "4x de R$ 47,25 sem juros", img: p1, tag: "Mais amado" },
  { name: "Argola Lisa Polida", price: "R$ 149,00", parc: "4x de R$ 37,25 sem juros", img: p2, tag: "Best-seller" },
  { name: "Trio de Anéis Delicados", price: "R$ 229,00", parc: "4x de R$ 57,25 sem juros", img: p3, tag: "Novidade" },
  { name: "Pulseira Riviera Cravejada", price: "R$ 319,00", parc: "4x de R$ 79,75 sem juros", img: p4, tag: "Edição limitada" },
];

export function MostLoved() {
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
          <a href="#" className="story-link text-[12px] tracking-[0.3em] uppercase text-foreground self-start md:self-end">
            Ver coleção completa
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8">
          {products.map((p, idx) => (
            <article
              key={p.name}
              className="group reveal"
              style={{ transitionDelay: `${idx * 70}ms` }}
            >
              <div className="relative img-zoom aspect-square bg-secondary rounded-sm">
                <img src={p.img} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute top-3 left-3 bg-background/90 backdrop-blur text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 text-charcoal">
                  {p.tag}
                </span>
                <button
                  aria-label="Favoritar"
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:text-cta transition-colors"
                >
                  <Heart className="h-4 w-4" />
                </button>
                <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  <button className="w-full bg-foreground text-background text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-cta transition-colors">
                    Adicionar
                  </button>
                </div>
              </div>
              <div className="pt-5 text-center">
                <h3 className="font-sans text-sm md:text-[15px] text-foreground">{p.name}</h3>
                <p className="mt-2 text-base md:text-lg text-foreground font-serif">{p.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.parc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
