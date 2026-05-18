import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/prata-z-logo-white.png";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

const navItems: { label: string; to: string; params?: Record<string, string> }[] = [
  { label: "Blog", to: "/blog" },
  { label: "Colares", to: "/categoria/$slug", params: { slug: "colares" } },
  { label: "Brincos", to: "/categoria/$slug", params: { slug: "brincos" } },
  { label: "Anéis", to: "/categoria/$slug", params: { slug: "aneis" } },
  { label: "Pulseiras", to: "/categoria/$slug", params: { slug: "pulseiras" } },
  { label: "Pingentes", to: "/categoria/$slug", params: { slug: "pingentes" } },
  { label: "Berloques", to: "/categoria/$slug", params: { slug: "berloques" } },
  { label: "Piercings", to: "/categoria/$slug", params: { slug: "piercings" } },
  { label: "Tornozeleiras", to: "/categoria/$slug", params: { slug: "tornozeleiras" } },
  { label: "Cuidados", to: "/categoria/$slug", params: { slug: "cuidados" } },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const cart = useCart();
  const fav = useFavorites();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/busca", search: { q: q.trim() } });
    setSearchOpen(false);
    setQ("");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-header text-header-foreground border-b border-header-foreground/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex items-center justify-between py-2 md:py-2">
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 -ml-2"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex-1 lg:flex-none flex justify-center lg:justify-start">
            <img src={logo} alt="Prata Z Joias" className="h-14 md:h-20 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-1 md:gap-3">
            <button
              aria-label="Buscar"
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 hover:text-nude-deep transition-colors"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              to="/favoritos"
              aria-label="Favoritos"
              className="p-2 hover:text-nude-deep transition-colors hidden sm:block relative"
            >
              <Heart className="h-[18px] w-[18px]" />
              {fav.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-cta text-[10px] text-cta-foreground flex items-center justify-center">
                  {fav.count}
                </span>
              )}
            </Link>
            <Link
              to="/sacola"
              aria-label="Sacola"
              className="p-2 hover:text-nude-deep transition-colors relative"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cart.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-cta text-[10px] text-cta-foreground flex items-center justify-center">
                  {cart.count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="pb-4 flex items-center gap-2 animate-fade-in">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="O que você está procurando?"
              className="flex-1 border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-foreground"
            />
            <button
              type="submit"
              className="bg-foreground text-background px-4 py-2 text-[11px] tracking-[0.2em] uppercase"
            >
              Buscar
            </button>
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Fechar busca" className="p-2">
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        <nav className="hidden lg:flex items-center justify-center gap-8 pb-4 text-[14px] tracking-wide">
          {navItems.map((item) =>
            item.params ? (
              <Link
                key={item.label}
                to={item.to as "/categoria/$slug"}
                params={item.params as { slug: string }}
                className="story-link text-foreground/80 hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to={item.to as "/blog"}
                className="story-link text-foreground/80 hover:text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {open && (
          <nav className="lg:hidden pb-4 flex flex-col gap-3 animate-fade-in">
            {navItems.map((item) =>
              item.params ? (
                <Link
                  key={item.label}
                  to={item.to as "/categoria/$slug"}
                  params={item.params as { slug: string }}
                  onClick={() => setOpen(false)}
                  className="text-sm py-1 text-foreground/80"
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.label}
                  to={item.to as "/blog"}
                  onClick={() => setOpen(false)}
                  className="text-sm py-1 text-foreground/80"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
