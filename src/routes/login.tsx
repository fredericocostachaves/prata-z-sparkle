import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";

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
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(mode === "login" ? "Bem-vinda de volta!" : "Conta criada!");
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
            <input required placeholder="Nome completo" className="w-full border border-border px-4 py-3 text-sm" />
          )}
          <input required type="email" placeholder="E-mail" className="w-full border border-border px-4 py-3 text-sm" />
          <input required type="password" placeholder="Senha" className="w-full border border-border px-4 py-3 text-sm" />
          <button type="submit" className="w-full bg-cta text-cta-foreground py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition">
            {mode === "login" ? "Entrar" : "Criar minha conta"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar você concorda com os <Link to="/termos" className="story-link">termos</Link> e a <Link to="/politica-privacidade" className="story-link">política de privacidade</Link>.
        </p>
      </section>
    </PageShell>
  );
}
