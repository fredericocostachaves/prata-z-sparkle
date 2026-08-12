import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useReveal } from "@/hooks/useScrollReveal";

interface Props {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: Props) {
  const fav = useFavorites();
  const cart = useCart();
  const revealRef = useReveal<HTMLElement>();
  const isFav = fav.has(product.id);
  const tag = product.tag ?? (product.isNew ? "Novidade" : product.bestSeller ? "Best-seller" : null);

  return (
    <article ref={revealRef} className="group reveal" style={{ transitionDelay: `${(index % 8) * 60}ms` }}>
      <div className="relative img-zoom aspect-square bg-secondary rounded-sm overflow-hidden">

        <Link to="/produto/$slug" params={{ slug: product.slug }} className="block h-full w-full">
          <img
            src={product.images[0]}
            alt={product.name}
            loading={index < 4 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : index < 4 ? "auto" : "low"}
            decoding="async"
            width="600"
            height="600"
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="h-full w-full object-cover"
          />
        </Link>
        {tag && (
          <span className="absolute top-3 left-3 bg-background/90 backdrop-blur text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 text-charcoal">
            {tag}
          </span>
        )}
        <button
          aria-label="Favoritar"
          onClick={(e) => {
            e.preventDefault();
            fav.toggle(product.id, product.name);
          }}
          className={`absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center transition-colors ${
            isFav ? "text-cta" : "hover:text-cta"
          }`}
        >
          <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
        </button>
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
          <button
            onClick={(e) => {
              e.preventDefault();
              cart.addItem(product);
            }}
            className="w-full bg-foreground text-background text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-cta transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>
      <div className="pt-5 text-center">
        <Link to="/produto/$slug" params={{ slug: product.slug }}>
          <h3 className="font-sans text-sm md:text-[15px] text-foreground hover:text-nude-deep transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-base md:text-lg text-foreground font-serif">{formatPrice(product.price)}</p>
        {typeof product.stock === "number" && (
          <p className="mt-1.5 text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
            {product.stock} {product.stock === 1 ? "disponível" : "disponíveis"}
          </p>
        )}
      </div>
    </article>
  );
}
