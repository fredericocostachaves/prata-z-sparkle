import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

const STORAGE_KEY = "prataz-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5 sm:px-8 sm:pb-8"
    >
      <div className="mx-auto max-w-4xl bg-nude text-foreground shadow-soft border border-foreground/10">
        <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
          <button
            type="button"
            onClick={() => decide("rejected")}
            aria-label="Fechar aviso"
            className="absolute top-3 right-3 text-foreground/60 hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-1 text-sm leading-relaxed text-foreground/85 pr-6">
            Utilizamos cookies para melhorar a sua experiência, personalizar
            conteúdo e analisar o tráfego do site. Ao continuar, você concorda
            com a nossa{" "}
            <Link
              to="/politica-cookies"
              className="underline hover:text-foreground/70 transition"
            >
              Política de Cookies
            </Link>
            .
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => decide("rejected")}
              className="px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase border border-foreground/30 hover:border-foreground transition"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => decide("accepted")}
              className="px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase bg-cta text-cta-foreground hover:bg-cta-hover transition"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
