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

// Código promocional (voucher) — definido pelo desenvolvedor.
// Ao aplicar um voucher válido, o desconto de 10% à vista (Pix ou crédito) NÃO é acumulado.
const VALID_VOUCHERS: Record<string, number> = {
  // código (case-insensitive) : taxa de desconto (0.15 = 15%)
  PRATAZ15: 0.15,
};

function getMaxInstallmentsByTier(subtotal: number): number {
  if (subtotal < 50) return 1;
  if (subtotal <= 100) return 2;
  if (subtotal <= 200) return 3;
  return 4;
}

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<"dados" | "entrega" | "pagamento">("dados");
  const [data, setData] = useState({
    name: "", email: "", cpf: "", phone: "",
    cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
    payment: "credito" as "credito" | "pix",
    installments: 1,
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; rate: number } | null>(null);

  const applyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      toast.error("Informe um código promocional.");
      return;
    }
    const rate = VALID_VOUCHERS[code];
    if (!rate) {
      toast.error("Código promocional inválido.");
      return;
    }
    setAppliedVoucher({ code, rate });
    toast.success(`Voucher aplicado: ${Math.round(rate * 100)}% de desconto.`);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
  };

  const handleCepChange = async (raw: string) => {
    const masked = raw.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
    setData((d) => ({ ...d, cep: masked }));
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setData((d) => ({
        ...d,
        street: json.logradouro || d.street,
        neighborhood: json.bairro || d.neighborhood,
        city: json.localidade || d.city,
        state: json.uf || d.state,
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP");
    } finally {
      setCepLoading(false);
    }
  };

  // Regras de negócio locais — calculadas em tempo real
  const subtotal = cart.total;
  const pixDiscount = data.payment === "pix" ? subtotal * PIX_DISCOUNT_RATE : 0;
  const totalFinal = subtotal - pixDiscount;

  // Parcelamento por faixa de valor bruto
  const maxInstallments = useMemo(() => {
    if (data.payment !== "credito" || subtotal <= 0) return 1;
    return getMaxInstallmentsByTier(subtotal);
  }, [data.payment, subtotal]);

  // Se o usuário trocar para um total menor, ajustamos o número de parcelas
  const currentInstallments = Math.min(data.installments, maxInstallments);
  const installmentValue = totalFinal / currentInstallments;

  const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  const validateDados = () => {
    if (!data.name.trim() || data.name.trim().length < 3) return "Informe seu nome completo.";
    if (!isEmailValid(data.email)) return "Informe um e-mail válido.";
    if (onlyDigits(data.cpf).length !== 11) return "Informe um CPF válido (11 dígitos).";
    if (onlyDigits(data.phone).length < 10) return "Informe um telefone válido com DDD.";
    return null;
  };

  const validateEntrega = () => {
    if (onlyDigits(data.cep).length !== 8) return "Informe um CEP válido (8 dígitos).";
    if (!data.street.trim()) return "Informe a rua.";
    if (!data.number.trim()) return "Informe o número.";
    if (!data.neighborhood.trim()) return "Informe o bairro.";
    if (!data.city.trim()) return "Informe a cidade.";
    if (data.state.trim().length !== 2) return "Informe o estado (UF) com 2 letras.";
    return null;
  };

  const goToEntrega = () => {
    const err = validateDados();
    if (err) { toast.error(err); return; }
    setStep("entrega");
  };

  const goToPagamento = () => {
    const err = validateEntrega();
    if (err) { toast.error(err); return; }
    setStep("pagamento");
  };

  const handleStepClick = (target: "dados" | "entrega" | "pagamento") => {
    if (target === "dados") { setStep("dados"); return; }
    const dadosErr = validateDados();
    if (dadosErr) { toast.error(dadosErr); setStep("dados"); return; }
    if (target === "entrega") { setStep("entrega"); return; }
    const entregaErr = validateEntrega();
    if (entregaErr) { toast.error(entregaErr); setStep("entrega"); return; }
    setStep("pagamento");
  };

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
                onClick={() => handleStepClick(s)}
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
              <button type="button" onClick={goToEntrega} className="bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">Continuar</button>
            </div>
          )}

          {step === "entrega" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif">Endereço de entrega</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    required
                    placeholder="CEP"
                    value={data.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    inputMode="numeric"
                    className="w-full border border-border px-4 py-3 text-sm"
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      buscando…
                    </span>
                  )}
                </div>
                <input required placeholder="Cidade" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              </div>
              <input required placeholder="Rua" value={data.street} onChange={(e) => setData({ ...data, street: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="Número" value={data.number} onChange={(e) => setData({ ...data, number: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
                <input placeholder="Complemento (opcional)" value={data.complement} onChange={(e) => setData({ ...data, complement: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="Bairro" value={data.neighborhood} onChange={(e) => setData({ ...data, neighborhood: e.target.value })} className="w-full border border-border px-4 py-3 text-sm" />
                <input required placeholder="Estado (UF)" value={data.state} onChange={(e) => setData({ ...data, state: e.target.value.toUpperCase() })} maxLength={2} className="w-full border border-border px-4 py-3 text-sm uppercase" />
              </div>
              <button type="button" onClick={goToPagamento} className="bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition">Continuar</button>
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
                  <span className="text-xs text-muted-foreground">
                    {maxInstallments === 1 ? "à vista" : `até ${maxInstallments}x sem juros`}
                  </span>
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

              {data.payment === "credito" && maxInstallments > 1 && (
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
                    Parcelamento disponível conforme o valor do pedido ({formatPrice(subtotal)}).
                  </p>
                </div>
              )}

              {data.payment === "credito" && maxInstallments === 1 && (
                <p className="text-[11px] text-muted-foreground">
                  Pedidos abaixo de {formatPrice(50)} são pagos somente à vista (1x).
                </p>
              )}

              {data.payment === "pix" && (
                <div className="border border-cta/30 bg-cta/5 p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor bruto</span>
                    <span className="line-through">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-cta font-medium">
                    <span>Desconto Pix (10%)</span>
                    <span>− {formatPrice(pixDiscount)}</span>
                  </div>
                  <div className="flex justify-between font-serif text-base pt-2 border-t border-cta/20">
                    <span>Total no Pix</span>
                    <span>{formatPrice(totalFinal)}</span>
                  </div>
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
