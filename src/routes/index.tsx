import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { Categories } from "@/components/Categories";
import { MostLoved } from "@/components/MostLoved";
import { GoogleReviews } from "@/components/GoogleReviews";
import { Authenticity } from "@/components/Authenticity";
import { Unboxing } from "@/components/Unboxing";
import { Showroom } from "@/components/Showroom";
import { VipGroup } from "@/components/VipGroup";
import { Footer } from "@/components/Footer";
import { FloatingButtons } from "@/components/FloatingButtons";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import hero1 from "@/assets/hero-1.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prata Z Joias — Alta joalheria em prata 925" },
      {
        name: "description",
        content:
          "Alta joalheria em prata 925 com atendimento personalizado de joias. Anéis, brincos, colares e pulseiras com garantia de autenticidade e envio para todo o Brasil.",
      },
      { property: "og:title", content: "Prata Z Joias — Alta joalheria em prata 925" },
      {
        property: "og:description",
        content:
          "Joias em prata 925 com garantia, parcelamento em 4x sem juros e experiência exclusiva de compra.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroBanner />
        <MostLoved />
        <Unboxing />
        <Showroom />
        <VipGroup />
        <GoogleReviews />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
