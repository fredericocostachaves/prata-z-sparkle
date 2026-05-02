import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conta/enderecos")({
  component: () => (
    <div>
      <h2 className="text-2xl font-serif mb-6">Endereços</h2>
      <div className="border border-border p-8 text-center text-muted-foreground">
        Nenhum endereço cadastrado ainda.
      </div>
      <button className="mt-6 bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">
        Adicionar endereço
      </button>
    </div>
  ),
});
