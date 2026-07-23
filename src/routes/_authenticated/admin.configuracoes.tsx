import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link, Check } from "lucide-react";
import { getBlingStatus, getBlingAuthUrl, exchangeBlingCode } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  validateSearch: (search: Record<string, unknown>) => ({
    bling_code: (search.bling_code as string) || "",
    bling_state: (search.bling_state as string) || "",
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { bling_code, bling_state } = Route.useSearch();
  const [blingStatus, setBlingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(false);
  const fetchStatus = useServerFn(getBlingStatus);
  const fetchAuthUrl = useServerFn(getBlingAuthUrl);
  const exchangeCode = useServerFn(exchangeBlingCode);

  const checkStatus = () => {
    fetchStatus()
      .then(setBlingStatus)
      .catch(() => setBlingStatus({ connected: false }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    checkStatus();

    const onVisible = () => {
      if (document.visibilityState === "visible") checkStatus();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (bling_code && !exchanging) {
      setExchanging(true);
      exchangeCode({ data: { code: bling_code, state: bling_state } })
        .then(() => {
          toast.success("Bling conectado com sucesso!");
          checkStatus();
          window.history.replaceState({}, "", "/admin/configuracoes");
        })
        .catch((e: any) => {
          toast.error(e.message || "Erro ao autorizar Bling");
          setExchanging(false);
          window.history.replaceState({}, "", "/admin/configuracoes");
        });
    }
  }, [bling_code]);

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
            {loading || exchanging ? (
              <span className="text-xs text-muted-foreground">{exchanging ? "Salvando..." : "Verificando..."}</span>
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
