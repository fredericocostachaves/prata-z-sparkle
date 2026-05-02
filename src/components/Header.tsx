import { Link } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/prata-z-logo.png";

const navItems = [
  "Blog",
  "Colares",
  "Brincos",
  "Anéis",
  "Pulseiras",
  "Pingentes",
  "Berloques",
  "Piercings",
  "Tornozeleiras",
  "Cuidados",
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* Main row */}
        <div className="flex items-center justify-between py-4 md:py-5">
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 -ml-2"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex-1 lg:flex-none flex justify-center lg:justify-start">
            <img
              src={logo}
              alt="Prata Z Joias"
              className="h-20 md:h-28 w-auto object-contain"
            />
          </Link>

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

        {/* Desktop nav row */}
        <nav className="hidden lg:flex items-center justify-center gap-7 pb-4 text-[12px] tracking-wide">
          {navItems.map((label) => (
            <a key={label} href="#" className="story-link text-foreground/80 hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>

        {/* Mobile nav */}
        {open && (
          <nav className="lg:hidden pb-4 flex flex-col gap-3 animate-fade-in">
            {navItems.map((label) => (
              <a
                key={label}
                href="#"
                onClick={() => setOpen(false)}
                className="text-sm py-1 text-foreground/80"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
