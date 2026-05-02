import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/conta/pedidos")({
  component: () => (
    <div>
      <h2 className="text-2xl font-serif mb-6">Meus pedidos</h2>
      <div className="border border-border p-8 text-center text-muted-foreground">
        Você ainda não tem pedidos por aqui.
      </div>
    </div>
  ),
});
