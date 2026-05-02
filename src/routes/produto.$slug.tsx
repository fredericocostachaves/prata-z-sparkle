import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ShoppingBag, Truck, ShieldCheck, Gift } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { formatInstallment, formatPrice, getProductBySlug, getProductsByCategory } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => {
    const p = getProductBySlug(params.slug);
    const title = p ? `${p.name} — Prata Z Joias` : "Produto — Prata Z Joias";
    const desc = p ? p.description : "Joia em prata 925.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(p ? [{ property: "og:image", content: p.images[0] }] : []),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const product = getProductBySlug(slug);
  const navigate = useNavigate();
  const cart = useCart();
  const fav = useFavorites();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | undefined>(product?.sizes?.[0]);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <PageShell eyebrow="Produto" title="Produto não encontrado">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <Link to="/" className="story-link text-[12px] tracking-[0.3em] uppercase">
            Voltar para a home
          </Link>
        </div>
      </PageShell>
    );
  }

  const related = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const isFav = fav.has(product.id);

  const handleAdd = () => cart.addItem(product, { qty, size });
  const handleBuy = () => {
    cart.addItem(product, { qty, size });
    navigate({ to: "/checkout" });
  };

  const whatsappMsg = encodeURIComponent(
    `Olá! Gostaria de saber mais sobre: ${product.name} (${formatPrice(product.price)})`,
  );

  return (
    <PageShell hideHero>
      <section className="mx-auto max-w-7xl px-6 sm:px-10 py-10 md:py-16">
        <nav className="text-xs text-muted-foreground mb-8 flex gap-2">
          <Link to="/" className="hover:text-foreground">Início</Link>
          <span>/</span>
          <Link
            to="/categoria/$slug"
            params={{ slug: product.category }}
            className="hover:text-foreground capitalize"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div>
            <div className="aspect-square bg-secondary rounded-sm overflow-hidden">
              <img
                src={product.images[active]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`aspect-square bg-secondary rounded-sm overflow-hidden border ${
                    active === i ? "border-foreground" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep capitalize">
              {product.category}
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-serif text-foreground">{product.name}</h1>
            <p className="mt-6 text-3xl font-serif text-foreground">{formatPrice(product.price)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatInstallment(product.price)}</p>

            <p className="mt-8 text-muted-foreground leading-relaxed">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-8">
                <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70 mb-3">
                  Tamanho
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-12 h-10 px-4 border text-sm transition ${
                        size === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70">Quantidade</p>
              <div className="flex border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2">−</button>
                <span className="px-4 py-2 min-w-12 text-center">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2">+</button>
              </div>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-3">
              <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 border border-foreground text-foreground py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition"
              >
                <ShoppingBag className="h-4 w-4" />
                Adicionar à sacola
              </button>
              <button
                onClick={handleBuy}
                className="flex items-center justify-center gap-2 bg-cta text-cta-foreground py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition"
              >
                Comprar agora
              </button>
            </div>

            <div className="mt-3 flex gap-3">
              <button
                onClick={() => fav.toggle(product.id, product.name)}
                className={`flex-1 flex items-center justify-center gap-2 border py-3 text-[11px] tracking-[0.2em] uppercase transition ${
                  isFav ? "border-cta text-cta" : "border-border hover:border-foreground"
                }`}
              >
                <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
                {isFav ? "Favoritado" : "Favoritar"}
              </button>
              <a
                href={`https://wa.me/5500000000000?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 border border-border hover:border-foreground py-3 text-[11px] tracking-[0.2em] uppercase transition"
              >
                Comprar pelo WhatsApp
              </a>
            </div>

            <ul className="mt-10 space-y-3">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="text-nude-deep">◆</span> {h}
                </li>
              ))}
            </ul>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
              <div className="text-center">
                <Truck className="h-5 w-5 mx-auto text-nude-deep" strokeWidth={1.5} />
                <p className="mt-2 text-[11px] tracking-wider uppercase">Envio Brasil</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="h-5 w-5 mx-auto text-nude-deep" strokeWidth={1.5} />
                <p className="mt-2 text-[11px] tracking-wider uppercase">Garantia 925</p>
              </div>
              <div className="text-center">
                <Gift className="h-5 w-5 mx-auto text-nude-deep" strokeWidth={1.5} />
                <p className="mt-2 text-[11px] tracking-wider uppercase">Embalagem premium</p>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-8">
              Você também vai amar
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
