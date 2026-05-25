import { ShieldCheck, Award, Sparkles } from "lucide-react";

export function Authenticity() {
  return (
    <section id="garantia" className="fluid-nude py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Compromisso Prata Z</p>
          <h2 className="mt-5 text-4xl md:text-5xl text-foreground">
            Garantia de autenticidade <em className="font-serif italic">prata 925</em>
          </h2>
          <p className="mt-5 text-muted-foreground">
            Cada peça que sai do nosso atelier passa por inspeção de pureza, brilho e
            acabamento. Você recebe a joia certa — e o certificado para comprovar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-14 mt-16">
          {[
            { icon: ShieldCheck, title: "Selo 925 verificado", desc: "Cada joia traz o selo de pureza, conferindo o teor mínimo de 92,5% de prata pura." },
            { icon: Award, title: "Certificado de origem", desc: "Documento físico que acompanha sua peça e assegura procedência e qualidade." },
            { icon: Sparkles, title: "Banho antialérgico", desc: "Acabamento ródio branco que potencializa o brilho e protege contra oxidação." },
          ].map((it, i) => (
            <div key={it.title} className="text-center reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="mx-auto h-14 w-14 rounded-full bg-background flex items-center justify-center shadow-soft">
                <it.icon className="h-6 w-6 text-nude-deep" strokeWidth={1.4} />
              </div>
              <h3 className="mt-6 text-xl font-serif text-foreground">{it.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
