import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Prata Z Joias" },
      { name: "description", content: "Acesse sua conta Prata Z." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "cadastro">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda de volta!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail se solicitado.");
      }
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Falha ao entrar com Google");
  };

  return (
    <PageShell eyebrow="Acesso" title={mode === "login" ? "Entrar" : "Criar conta"}>
      <section className="mx-auto max-w-md px-6 sm:px-10 py-12 md:py-16">
        <div className="flex border border-border mb-8">
          <button onClick={() => setMode("login")} className={`flex-1 py-3 text-[12px] tracking-[0.2em] uppercase ${mode === "login" ? "bg-foreground text-background" : ""}`}>Entrar</button>
          <button onClick={() => setMode("cadastro")} className={`flex-1 py-3 text-[12px] tracking-[0.2em] uppercase ${mode === "cadastro" ? "bg-foreground text-background" : ""}`}>Cadastrar</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "cadastro" && (
            <input required placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-border px-4 py-3 text-sm" />
          )}
          <input required type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-border px-4 py-3 text-sm" />
          <input required type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="w-full border border-border px-4 py-3 text-sm" />
          <button type="submit" disabled={loading} className="w-full bg-cta text-cta-foreground py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition disabled:opacity-50">
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar minha conta"}
          </button>
        </form>
        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="flex-1 h-px bg-border" /> ou <span className="flex-1 h-px bg-border" />
        </div>
        <button onClick={signInGoogle} type="button" className="w-full border border-border py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-secondary transition">
          Continuar com Google
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar você concorda com os <Link to="/termos" className="story-link">termos</Link> e a <Link to="/politica-privacidade" className="story-link">política de privacidade</Link>.
        </p>
      </section>
    </PageShell>
  );
}
