import unboxing from "@/assets/unboxing.jpg";

export function Unboxing() {
  return (
    <section className="py-24 md:py-32 bg-background">
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
            Embalagem rosa nude assinada, lenço de cetim, cartão com mensagem positiva e
            uma flanela exclusiva para preservar o brilho da sua joia. Cada detalhe foi
            pensado para encantar quem recebe.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Caixa rígida em rosa nude com selo dourado de assinatura",
              "Cartão com mensagem feita à mão para você ou para presentear",
              "Flanela antiembaçante e saquinho protetor",
              "Embalagem-presente disponível em todas as compras",
            ].map((t) => (
              <li key={t} className="flex gap-3 text-sm text-foreground/80">
                <span className="mt-2 h-[3px] w-6 bg-nude shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
