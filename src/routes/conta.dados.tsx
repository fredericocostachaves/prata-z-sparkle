import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conta/dados")({
  component: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-serif mb-6">Meus dados</h2>
      <input placeholder="Nome completo" className="w-full border border-border px-4 py-3 text-sm" />
      <input type="email" placeholder="E-mail" className="w-full border border-border px-4 py-3 text-sm" />
      <input placeholder="Telefone" className="w-full border border-border px-4 py-3 text-sm" />
      <button className="bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">
        Salvar alterações
      </button>
    </div>
  ),
});
