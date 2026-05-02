import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, formatInstallment } from "@/data/products";

export const Route = createFileRoute("/sacola")({
  head: () => ({
    meta: [
      { title: "Sua sacola — Prata Z Joias" },
      { name: "description", content: "Confira os itens da sua sacola na Prata Z." },
    ],
  }),
  component: SacolaPage,
});

function SacolaPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <PageShell eyebrow="Sacola" title="Sua sacola está vazia">
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-nude-deep" strokeWidth={1} />
          <p className="mt-6 text-muted-foreground">Que tal começar pela seleção dos mais amados?</p>
          <Link to="/" className="mt-6 inline-block bg-cta text-cta-foreground px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition">
            Explorar coleção
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Sacola" title="Sua sacola">
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-12 md:py-16 grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.items.map((it) => (
            <div key={it.productId + (it.size ?? "")} className="flex gap-5 border-b border-border pb-6">
              <Link to="/produto/$slug" params={{ slug: it.slug }} className="block w-28 h-28 bg-secondary shrink-0">
                <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex-1">
                <Link to="/produto/$slug" params={{ slug: it.slug }} className="font-serif text-lg text-foreground hover:text-nude-deep">
                  {it.name}
                </Link>
                {it.size && <p className="text-xs text-muted-foreground">Tamanho: {it.size}</p>}
                <p className="mt-2 font-serif text-foreground">{formatPrice(it.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex border border-border">
                    <button onClick={() => cart.updateQty(it.productId, it.qty - 1, it.size)} className="px-3 py-1">−</button>
                    <span className="px-4 py-1 min-w-10 text-center">{it.qty}</span>
                    <button onClick={() => cart.updateQty(it.productId, it.qty + 1, it.size)} className="px-3 py-1">+</button>
                  </div>
                  <button onClick={() => cart.removeItem(it.productId, it.size)} aria-label="Remover" className="text-muted-foreground hover:text-cta">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="font-serif text-foreground whitespace-nowrap">{formatPrice(it.price * it.qty)}</p>
            </div>
          ))}
        </div>

        <aside className="bg-secondary/40 p-8 h-fit">
          <h2 className="text-xl font-serif text-foreground">Resumo</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cart.total)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>Calculado no checkout</span></div>
          </div>
          <div className="mt-6 pt-6 border-t border-border flex justify-between text-lg font-serif">
            <span>Total</span><span>{formatPrice(cart.total)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{formatInstallment(cart.total)}</p>
          <Link to="/checkout" className="mt-6 block text-center bg-cta text-cta-foreground py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition">
            Finalizar compra
          </Link>
          <button onClick={cart.clear} className="mt-3 w-full text-xs text-muted-foreground hover:text-cta">
            Esvaziar sacola
          </button>
        </aside>
      </section>
    </PageShell>
  );
}
