import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">Erro 404</p>
        <h1 className="mt-4 text-5xl font-serif text-foreground">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-cta text-cta-foreground px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta-hover transition"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Prata Z Joias — Alta joalheria em prata 925" },
      {
        name: "description",
        content:
          "Alta joalheria em prata 925 com atendimento personalizado de joias. Anéis, brincos, colares e pulseiras com garantia de autenticidade.",
      },
      { name: "author", content: "Prata Z Joias" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <Outlet />
        <Toaster />
        {/* Bot Conversa widget slot — substituir pelo script do widget quando integrado */}
        <div id="botconversa-widget" />
      </FavoritesProvider>
    </CartProvider>
  );
}
