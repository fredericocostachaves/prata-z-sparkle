import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/showroom")({
  head: () => ({
    meta: [
      { title: "Agende sua visita ao Showroom Prata Z" },
      { name: "description", content: "Atendimento personalizado de joias no nosso showroom. Agende sua visita e experimente as peças com calma, ao lado de um especialista." },
      { property: "og:title", content: "Showroom Prata Z" },
      { property: "og:description", content: "Atendimento individual com agendamento via Google Agenda." },
    ],
  }),
  component: ShowroomPage,
});

function ShowroomPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", note: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pedido enviado!", { description: "Entraremos em contato para confirmar seu horário." });
    setForm({ name: "", email: "", phone: "", date: "", note: "" });
  };

  return (
    <PageShell eyebrow="Showroom Prata Z" title="Atendimento individual, só para você" subtitle="Experimente as peças com calma, ao lado de um especialista, em um ambiente preparado para o seu momento.">
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-12 md:py-16 grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Calendar className="h-5 w-5 text-nude-deep mt-1" strokeWidth={1.5} />
            <div>
              <p className="font-medium text-foreground">Agendamento via Google Agenda</p>
              <p className="text-sm text-muted-foreground">Escolha o melhor horário para sua visita.</p>
              <a
                href="https://calendar.google.com/calendar/appointments"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 bg-cta text-cta-foreground px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition"
              >
                Abrir Google Agenda
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="h-5 w-5 text-nude-deep mt-1" strokeWidth={1.5} />
            <div>
              <p className="font-medium text-foreground">Endereço</p>
              <p className="text-sm text-muted-foreground">Rua das Joias, 123 — sala 4 · Centro</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="h-5 w-5 text-nude-deep mt-1" strokeWidth={1.5} />
            <div>
              <p className="font-medium text-foreground">Horários</p>
              <p className="text-sm text-muted-foreground">Seg a sex · 10h às 19h · Sáb · 10h às 14h</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-secondary/40 p-8 space-y-4">
          <h2 className="text-2xl font-serif text-foreground">Solicitar agendamento</h2>
          <input required placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <input required placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <textarea placeholder="Conte um pouco do que procura (opcional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={4} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <button type="submit" className="w-full bg-foreground text-background py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">
            Solicitar visita
          </button>
        </form>
      </section>
    </PageShell>
  );
}
