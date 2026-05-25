import showroom from "@/assets/showroom.jpg";
import { Calendar, MapPin } from "lucide-react";

export function Showroom() {
  return (
    <section id="showroom" className="fluid-nude py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="order-2 lg:order-1 reveal">
          <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Showroom Prata Z</p>
          <h2 className="mt-5 text-4xl md:text-5xl text-foreground">
            Atendimento individual, <em className="font-serif italic">porque você merece um momento só seu</em>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Agende uma visita ao nosso showroom e viva uma experiência exclusiva: você
            experimenta as peças com calma, ao lado de um especialista dedicado, em um
            ambiente preparado para o seu momento.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-4">
              <Calendar className="h-5 w-5 text-nude-deep mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-foreground">Agendamento via Google Agenda</p>
                <p className="text-sm text-muted-foreground">Escolha o melhor horário para sua visita.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-nude-deep mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-foreground">Atendimento personalizado</p>
                <p className="text-sm text-muted-foreground">Consultoria de estilo, ajustes e provas exclusivas.</p>
              </div>
            </div>
          </div>

          <a
            href="https://calendar.google.com/calendar/appointments"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-3 bg-cta text-cta-foreground px-8 py-4 text-[13px] tracking-[0.2em] uppercase hover:bg-cta-hover transition-all hover:shadow-elegant"
          >
            Agendar minha visita
          </a>
        </div>

        <div className="order-1 lg:order-2 img-zoom aspect-[4/5] rounded-sm reveal">
          <img
            src={showroom}
            alt="Showroom Prata Z com vitrines de joias em prata 925"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
