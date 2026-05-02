import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";

interface Props {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  hideHero?: boolean;
}

export function PageShell({ children, eyebrow, title, subtitle, hideHero }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        {!hideHero && (title || eyebrow) && (
          <section className="bg-secondary/40 border-b border-border/40">
            <div className="mx-auto max-w-5xl px-6 sm:px-10 py-16 md:py-20 text-center">
              {eyebrow && (
                <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep">{eyebrow}</p>
              )}
              {title && (
                <h1 className="mt-4 text-4xl md:text-5xl font-serif text-foreground">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
              )}
            </div>
          </section>
        )}
        {children}
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
