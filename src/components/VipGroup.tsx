export function VipGroup() {
  return (
    <section id="vip" className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-4xl px-6 sm:px-10 text-center">
        <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Comunidade exclusiva</p>
        <h2 className="mt-5 text-4xl md:text-5xl text-foreground">
          Entre para o <em className="font-serif italic">Grupo VIP no WhatsApp</em>
        </h2>
        <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
          Lançamentos antecipados, descontos exclusivos, sorteios e curadoria especial
          direto no seu celular — antes de qualquer outro lugar.
        </p>

        <a
          href="https://chat.whatsapp.com/JOxxfnjQtewCs1UEylAVfS"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 text-[13px] tracking-[0.2em] uppercase hover:bg-cta transition-all hover:shadow-elegant"
        >
          Quero entrar no grupo VIP
        </a>

        <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto text-left">
          {[
            { n: "01", t: "Lançamentos", d: "Acesso 48h antes" },
            { n: "02", t: "Descontos", d: "Cupons exclusivos" },
            { n: "03", t: "Curadoria", d: "Sugestões para você" },
          ].map((b) => (
            <div key={b.n} className="border-t border-border pt-5">
              <p className="text-[11px] tracking-[0.3em] text-nude-deep">{b.n}</p>
              <p className="mt-3 text-sm font-medium text-foreground">{b.t}</p>
              <p className="text-xs text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
