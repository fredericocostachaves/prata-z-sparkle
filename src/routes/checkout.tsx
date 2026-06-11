import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Prata Z Joias" },
      { name: "description", content: "Finalize a sua compra na Prata Z com segurança." },
    ],
  }),
  component: CheckoutPage,
});

const PIX_DISCOUNT_RATE = 0.1; // 10%
const MIN_INSTALLMENT_VALUE = 37.5; // R$ 37,50 por parcela
const MAX_INSTALLMENTS = 12;

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<"dados" | "entrega" | "pagamento">("dados");
  const [data, setData] = useState({
    name: "", email: "", cpf: "", phone: "",
    cep: "", street: "", number: "", city: "", state: "",
    payment: "credito" as "credito" | "pix",
    installments: 1,
  });

  // Regras de negócio locais — calculadas em tempo real
  const subtotal = cart.total;
  const pixDiscount = data.payment === "pix" ? subtotal * PIX_DISCOUNT_RATE : 0;
  const totalFinal = subtotal - pixDiscount;

  // Parcelamento inteligente: cada parcela >= R$ 37,50
  const maxInstallments = useMemo(() => {
    if (data.payment !== "credito" || subtotal <= 0) return 1;
    const possible = Math.floor(subtotal / MIN_INSTALLMENT_VALUE);
    return Math.max(1, Math.min(MAX_INSTALLMENTS, possible));
  }, [data.payment, subtotal]);

  // Se o usuário trocar para um total menor, ajustamos o número de parcelas
  const currentInstallments = Math.min(data.installments, maxInstallments);
  const installmentValue = totalFinal / currentInstallments;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Próxima etapa: disparo do webhook n8n com loading state.
    toast.success("Pedido recebido!", { description: "Você receberá um e-mail de confirmação." });
    cart.clear();
    navigate({ to: "/" });
  };

  if (cart.items.length === 0) {
    return (
      <PageShell eyebrow="Checkout" title="Sua sacola está vazia">
        <div className="text-center py-16 text-muted-foreground">
          Adicione peças à sua sacola para finalizar a compra.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Checkout" title="Finalizar compra">
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-12 md:py-16 grid lg:grid-cols-3 gap-12">
        <form onSubmit={submit} className="lg:col-span-2 space-y-8">
          <div className="flex gap-2 text-[11px] tracking-[0.2em] uppercase">
            {(["dados", "entrega", "pagamento"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={`px-4 py-2 border ${step === s ? "border-foreground bg-foreground text-background" : "border-border"}`}
              >
                {s}
              </button>
            ))}
          </div>

          {step === "dados" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif">Seus dados</h2>
              <input required placeholder="Nome completo" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              <input required type="email" placeholder="E-mail" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="CPF" value={data.cpf} onChange={(e) => setData({ ...data, cpf: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
                <input required placeholder="Telefone" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              </div>
              <button type="button" onClick={() => setStep("entrega")} className="bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">Continuar</button>
            </div>
          )}

          {step === "entrega" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif">Endereço de entrega</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="CEP" value={data.cep} onChange={(e) => setData({ ...data, cep: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
                <input required placeholder="Cidade" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              </div>
              <input required placeholder="Rua" value={data.street} onChange={(e) => setData({ ...data, street: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="Número" value={data.number} onChange={(e) => setData({ ...data, number: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
                <input required placeholder="Estado" value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              </div>
              <button type="button" onClick={() => setStep("pagamento")} className="bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">Continuar</button>
            </div>
          )}

          {step === "pagamento" && (
            <div className="space-y-5">
              <h2 className="text-2xl font-serif">Pagamento</h2>
              <div className="space-y-2">
                <label className="flex items-center justify-between gap-3 border border-border p-4 cursor-pointer hover:border-foreground transition">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pay"
                      value="credito"
                      checked={data.payment === "credito"}
                      onChange={() => setData({ ...data, payment: "credito", installments: 1 })}
                    />
                    <span>Cartão de crédito</span>
                  </div>
                  <span className="text-xs text-muted-foreground">até {maxInstallments}x sem juros</span>
                </label>

                <label className="flex items-center justify-between gap-3 border border-border p-4 cursor-pointer hover:border-foreground transition">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="pay"
                      value="pix"
                      checked={data.payment === "pix"}
                      onChange={() => setData({ ...data, payment: "pix" })}
                    />
                    <span>Pix</span>
                  </div>
                  <span className="text-xs text-cta font-medium">10% de desconto</span>
                </label>
              </div>

              {data.payment === "credito" && (
                <div className="space-y-2">
                  <label className="block text-xs tracking-[0.2em] uppercase text-muted-foreground">
                    Parcelas
                  </label>
                  <select
                    value={currentInstallments}
                    onChange={(e) => setData({ ...data, installments: Number(e.target.value) })}
                    className="w-full border border-border px-4 py-3 text-sm bg-background"
                  >
                    {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x de {formatPrice(totalFinal / n)} sem juros
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Mínimo de {formatPrice(MIN_INSTALLMENT_VALUE)} por parcela.
                  </p>
                </div>
              )}

              <button type="submit" className="bg-cta text-cta-foreground px-8 py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition">
                Confirmar pedido
              </button>
            </div>
          )}
        </form>

        <aside className="bg-secondary/40 p-8 h-fit space-y-3">
          <h3 className="text-lg font-serif text-foreground">Seu pedido</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map((it) => (
              <li key={it.productId + (it.size ?? "")} className="flex justify-between gap-3">
                <span>{it.name} × {it.qty}</span>
                <span>{formatPrice(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {pixDiscount > 0 && (
              <div className="flex justify-between text-cta animate-in fade-in slide-in-from-top-1 duration-300">
                <span>Desconto Pix (10%)</span>
                <span>− {formatPrice(pixDiscount)}</span>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-border flex justify-between text-lg font-serif">
            <span>Total</span><span>{formatPrice(totalFinal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.payment === "pix"
              ? "À vista no Pix"
              : `${currentInstallments}x de ${formatPrice(installmentValue)} sem juros`}
          </p>
        </aside>
      </section>
    </PageShell>
  );
}
