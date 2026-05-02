import { Link } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const navItems = [
    { label: "Anéis", to: "/" },
    { label: "Brincos", to: "/" },
    { label: "Colares", to: "/" },
    { label: "Pulseiras", to: "/" },
    { label: "Showroom", to: "/" },
    { label: "Grupo VIP", to: "/" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* Top utility row */}
        <div className="hidden md:flex items-center justify-between py-2 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
          <span>Prata 925 com garantia de autenticidade</span>
          <div className="flex gap-6">
            <a href="#showroom" className="hover:text-foreground transition-colors">Agendar showroom</a>
            <a href="#vip" className="hover:text-foreground transition-colors">Grupo VIP</a>
          </div>
        </div>

        {/* Main row */}
        <div className="flex items-center justify-between py-5 md:py-7">
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 -ml-2"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex-1 md:flex-none flex justify-center md:justify-start">
            <div className="text-center md:text-left">
              <div className="brand-wordmark text-3xl md:text-4xl text-foreground leading-none">
                Prata <span className="italic font-serif text-nude-deep">Z</span>
              </div>
              <div className="text-[9px] tracking-[0.45em] uppercase text-muted-foreground mt-1">
                Joias · Sterling 925
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-9 text-[13px] tracking-wide">
            {navItems.map((it) => (
              <a key={it.label} href="#" className="story-link text-foreground/80 hover:text-foreground">
                {it.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-3">
            <button aria-label="Buscar" className="p-2 hover:text-nude-deep transition-colors">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button aria-label="Favoritos" className="p-2 hover:text-nude-deep transition-colors hidden sm:block">
              <Heart className="h-[18px] w-[18px]" />
            </button>
            <button aria-label="Sacola" className="p-2 hover:text-nude-deep transition-colors relative">
              <ShoppingBag className="h-[18px] w-[18px]" />
              <span className="absolute top-1 right-1 h-[6px] w-[6px] rounded-full bg-cta" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="lg:hidden pb-4 flex flex-col gap-3 animate-fade-in">
            {navItems.map((it) => (
              <a
                key={it.label}
                href="#"
                onClick={() => setOpen(false)}
                className="text-sm py-1 text-foreground/80"
              >
                {it.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
