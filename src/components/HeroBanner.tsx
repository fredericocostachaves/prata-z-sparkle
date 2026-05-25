import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    eyebrow: "Pagamento facilitado",
    title: "Parcele em até 4x sem juros",
    subtitle: "Seu porta joias renovado com a melhor forma de pagamento.",
    cta: "Comprar agora",
    href: "/categoria/colares",
  },
  {
    eyebrow: "Selo de qualidade",
    title: "Prata 925 com garantia de autenticidade",
    subtitle: "Cada peça acompanha certificado de origem e pureza.",
    cta: "Conhecer a garantia",
    href: "/autenticidade",
  },
  {
    eyebrow: "Logística cuidadosa",
    title: "Envio para todo o Brasil",
    subtitle: "Embalagem premium, rastreio e cuidado do começo ao fim.",
    cta: "Ver coleções",
    href: "/categoria/aneis",
  },
  {
    eyebrow: "Atendimento exclusivo",
    title: "Experiência exclusiva de compra",
    subtitle: "Consultoria personalizada e visita ao nosso showroom.",
    cta: "Agendar visita",
    href: "/showroom",
  },
];

import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
const images = [hero1, hero2, hero3, hero1];

export function HeroBanner() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) =>
    setI((p) => (p + dir + slides.length) % slides.length);

  return (
    <section className="relative w-full h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden bg-secondary">
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0">
            <img
              src={images[idx]}
              alt={s.title}
              decoding="async"
              className="h-full w-full object-cover animate-ken-burns"
              {...(idx === 0
                ? { fetchPriority: "high" as const, loading: "eager" as const }
                : { loading: "lazy" as const })}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/0 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl h-full px-6 sm:px-10 flex items-center">
            <div className="max-w-xl">
              {i === idx && (
                <>
                  <p className="animate-fade-up text-[11px] tracking-[0.4em] uppercase text-nude-deep">
                    {s.eyebrow}
                  </p>
                  <h1 className="animate-fade-up delay-100 mt-5 text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.05]">
                    {s.title}
                  </h1>
                  <p className="animate-fade-up delay-200 mt-5 text-base md:text-lg text-muted-foreground max-w-md">
                    {s.subtitle}
                  </p>
                  <a
                    href={s.href}
                    className="animate-fade-up delay-300 mt-8 inline-flex items-center gap-3 bg-cta text-cta-foreground px-8 py-4 text-[13px] tracking-[0.2em] uppercase hover:bg-cta-hover transition-all hover:shadow-elegant"
                  >
                    {s.cta}
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={() => go(-1)}
        aria-label="Anterior"
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-background/70 backdrop-blur hover:bg-background transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Próximo"
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-background/70 backdrop-blur hover:bg-background transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-[3px] transition-all duration-500 ${
              i === idx ? "w-12 bg-foreground" : "w-6 bg-foreground/30 hover:bg-foreground/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
