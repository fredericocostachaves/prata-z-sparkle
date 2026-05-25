import { useRef, useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const reviews = [
  {
    name: "Ana Paula M.",
    rating: 5,
    date: "2 semanas atrás",
    text: "Atendimento impecável! A consultora entendeu exatamente o que eu queria e me ajudou a escolher o colar perfeito. A prata é de altíssima qualidade, dá pra sentir a diferença. Já estou planejando minha próxima compra!",
  },
  {
    name: "Fernanda R.",
    rating: 5,
    date: "1 mês atrás",
    text: "Comprei um anel de noivado em prata 925 e fiquei encantada com o acabamento. A embalagem premium fez toda a diferença na hora de presentear. Meu noivo amou! O atendimento individual realmente existe e faz toda a diferença.",
  },
  {
    name: "Carolina S.",
    rating: 5,
    date: "3 semanas atrás",
    text: "Sou cliente há mais de um ano e a Prata Z nunca me decepcionou. As pulseiras são lindas, duráveis e o selo de autenticidade dá muita segurança. Recomendo de olhos fechados para quem busca joias de verdade.",
  },
  {
    name: "Juliana T.",
    rating: 5,
    date: "2 meses atrás",
    text: "Fui atendida no showroom e a experiência foi única. Pude experimentar todas as peças com calma, sem pressa. A consultora tinha um conhecimento incrível sobre prata 925 e me ensinou a cuidar das minhas joias. Voltarei sempre!",
  },
  {
    name: "Mariana L.",
    rating: 5,
    date: "1 semana atrás",
    text: "O brinco que comprei é simplesmente deslumbrante. O brilho da prata esterlina 925 é incomparável. Chegou super rápido e na embalagem mais linda que já vi. Parabéns pelo cuidado com cada detalhe!",
  },
  {
    name: "Patrícia G.",
    rating: 5,
    date: "1 mês atrás",
    text: "Participo do grupo VIP do WhatsApp e sempre sou a primeira a saber das novidades. O atendimento é tão personalizado que parece que estou em uma joalheria de luxo. A relação custo-benefício é excelente.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export function GoogleReviews() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const indexRef = useRef(0);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "left" ? -360 : 360;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isPaused) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 5) {
        el.scrollTo({ left: 0, behavior: "smooth" });
        indexRef.current = 0;
      } else {
        el.scrollBy({ left: 360, behavior: "smooth" });
        indexRef.current += 1;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="reveal">
            <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">
              Depoimentos
            </p>
            <h2 className="mt-4 text-3xl md:text-4xl font-serif text-foreground">
              O que nossas clientes dizem
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-medium text-foreground">Google Reviews</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-semibold text-foreground">5,0</span>
                <StarRating rating={5} />
                <span className="text-sm text-muted-foreground">(42 avaliações)</span>
              </div>
            </div>
          </div>

          {/* Arrows desktop */}
          <div className="hidden md:flex gap-2 reveal">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-6 px-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reviews.map((review, i) => (
            <div
              key={i}
              className="reveal min-w-[300px] md:min-w-[340px] snap-start bg-card border border-border/60 rounded-xl p-6 flex flex-col"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <Quote className="w-6 h-6 text-nude-deep/40 mb-3" />
              <p className="text-sm text-foreground leading-relaxed flex-1">
                "{review.text}"
              </p>
              <div className="mt-5 pt-5 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile scroll hint */}
        <p className="md:hidden mt-4 text-center text-xs text-muted-foreground">
          Deslize para ver mais avaliações
        </p>
      </div>
    </section>
  );
}
