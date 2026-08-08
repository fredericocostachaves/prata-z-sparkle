import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Consome o retorno do OAuth do Lovable/Supabase.
 *
 * O broker de OAuth redireciona o navegador de volta para o app com o token de
 * acesso no hash da URL:
 *
 *   https://.../#access_token=...&refresh_token=...&token_type=bearer...
 *
 * Nada no app lia esse hash para estabelecer a sessão do Supabase (por isso
 * admin/* sempre redirecionava de volta para /login). Aqui detectamos o hash,
 * fixamos a sessão, limpamos a URL e levamos o usuário direto para o admin.
 */
export function AuthOAuthCallback() {
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled) return;

    const raw = window.location.hash;
    const params = new URLSearchParams(raw.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setHandled(true);
      return;
    }

    const expiresIn = params.get("expires_in");
    const options: { access_token: string; refresh_token: string; expires_in?: number } = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    if (expiresIn) {
      const n = Number(expiresIn);
      if (Number.isFinite(n) && n > 0) options.expires_in = n;
    }

    (async () => {
      try {
        await supabase.auth.setSession(options);
        // Limpa o hash e evita que o token fique visível/codificado na URL.
        window.history.replaceState(null, "", window.location.pathname);
      } catch (err) {
        console.warn("[Auth] Falha ao processar retorno do OAuth:", err);
      } finally {
        setHandled(true);
        // Só navega depois da sessão estar fixada; o guard do admin faz o resto.
        if (window.location.pathname !== "/admin/produtos") {
          window.location.replace("/admin/produtos");
        }
      }
    })();
  }, [handled]);

  return null;
}
