import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link, ExternalLink, Check, X } from "lucide-react";
import { getBlingStatus, getBlingAuthUrl } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [blingStatus, setBlingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchStatus = useServerFn(getBlingStatus);
  const fetchAuthUrl = useServerFn(getBlingAuthUrl);

  useEffect(() => {
    fetchStatus()
      .then(setBlingStatus)
      .catch(() => setBlingStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleConnectBling = async () => {
    try {
      const { url } = await fetchAuthUrl();
      window.open(url, "_blank");
      toast.success("Autorize o app no Bling na janela aberta");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Sistema</p>
        <h1 className="font-serif text-3xl mt-1">Configurações</h1>
      </div>

      <section className="border border-border p-6">
        <h2 className="font-serif text-xl mb-4">Integrações</h2>

        <div className="flex items-center justify-between p-4 bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">B</span>
            </div>
            <div>
              <p className="font-medium">Bling ERP</p>
              <p className="text-xs text-muted-foreground">
                Sincronize produtos e pedidos com o Bling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-xs text-muted-foreground">Verificando...</span>
            ) : blingStatus?.connected ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3 w-3" /> Conectado
                </span>
                <button
                  onClick={handleConnectBling}
                  className="text-xs border border-border px-3 py-1 hover:bg-secondary"
                >
                  Reconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectBling}
                className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-xs tracking-[0.2em] uppercase"
              >
                <Link className="h-3 w-3" /> Conectar
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
