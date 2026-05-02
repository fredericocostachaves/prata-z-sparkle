import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Instagram, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Prata Z Joias" },
      { name: "description", content: "Fale com a Prata Z: WhatsApp, e-mail e Instagram. Atendimento personalizado para suas joias em prata 925." },
      { property: "og:title", content: "Contato Prata Z" },
      { property: "og:description", content: "WhatsApp, e-mail e Instagram para atendimento personalizado." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Mensagem enviada!", { description: "Responderemos em até 1 dia útil." });
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <PageShell eyebrow="Atendimento" title="Vamos conversar" subtitle="Estamos por aqui para tirar dúvidas, sugerir peças e te atender com todo o cuidado.">
      <section className="mx-auto max-w-5xl px-6 sm:px-10 py-12 md:py-16 grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
            <Phone className="h-5 w-5 text-nude-deep mt-1" strokeWidth={1.5} />
            <div>
              <p className="font-medium text-foreground group-hover:text-nude-deep">WhatsApp</p>
              <p className="text-sm text-muted-foreground">(00) 00000-0000</p>
            </div>
          </a>
          <a href="mailto:contato@prataz.com.br" className="flex items-start gap-4 group">
            <Mail className="h-5 w-5 text-nude-deep mt-1" strokeWidth={1.5} />
            <div>
              <p className="font-medium text-foreground group-hover:text-nude-deep">E-mail</p>
              <p className="text-sm text-muted-foreground">contato@prataz.com.br</p>
            </div>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
            <Instagram className="h-5 w-5 text-nude-deep mt-1" strokeWidth={1.5} />
            <div>
              <p className="font-medium text-foreground group-hover:text-nude-deep">Instagram</p>
              <p className="text-sm text-muted-foreground">@prataz</p>
            </div>
          </a>
        </div>

        <form onSubmit={submit} className="bg-secondary/40 p-8 space-y-4">
          <h2 className="text-2xl font-serif text-foreground">Envie uma mensagem</h2>
          <input required placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <textarea required rows={5} placeholder="Sua mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
          <button type="submit" className="w-full bg-foreground text-background py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">
            Enviar mensagem
          </button>
        </form>
      </section>
    </PageShell>
  );
}
