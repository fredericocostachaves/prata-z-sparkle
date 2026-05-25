import unboxing from "@/assets/unboxing.jpg";

export function Unboxing() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="img-zoom aspect-[4/5] rounded-sm reveal">
          <img
            src={unboxing}
            alt="Embalagem rosa nude da Prata Z com colar de prata 925 e cartão personalizado"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="reveal">
          <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Experiência de unboxing</p>
          <h2 className="mt-5 text-4xl md:text-5xl text-foreground">
            Abrir uma caixa Prata Z é <em className="font-serif italic">um presente em si</em>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Nossas embalagens representam a feminilidade das nossas clientes, por isso,
            você recebe com as suas joias, embalagens que reforçam o seu empoderamento
            e exclusividade.
          </p>
        </div>
      </div>
    </section>
  );
}
