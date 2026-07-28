import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { categories, getCategory, getProductsByCategory, type Product } from "@/data/products";
import { listCategoryProducts } from "@/lib/catalog.functions";
import type { CatalogProduct, CatalogCategorySlug } from "@/lib/catalog.types";
import catFallback from "@/assets/cat-colar.jpg";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => {
    const cat = getCategory(params.slug);
    const title = cat
      ? `${cat.name} em prata 925 — Prata Z Joias`
      : "Categoria — Prata Z Joias";
    const desc = cat
      ? `${cat.description}. Alta joalheria em prata 925 com atendimento personalizado.`
      : "Catálogo Prata Z Joias.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: CategoryPage,
});

type Sort = "destaques" | "menor" | "maior" | "novos";

function toProduct(p: CatalogProduct): Product {
  const slug = `${p.sku}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const images = [p.image, ...(p.gallery ?? [])].filter(Boolean) as string[];
  return {
    id: p.id,
    slug: slug || p.id,
    name: p.name,
    category: p.category as Product["category"],
    price: p.price,
    images: images.length ? images : [catFallback],
    description: p.description ?? "",
    highlights: [],
    stock: p.stock,
  };
}

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-secondary rounded-sm" />
      <div className="pt-5 flex flex-col items-center gap-2">
        <div className="h-3 w-3/4 bg-secondary rounded-sm" />
        <div className="h-4 w-1/3 bg-secondary rounded-sm" />
        <div className="h-2.5 w-1/4 bg-secondary rounded-sm" />
      </div>
    </div>
  );
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = getCategory(slug);
  const [sort, setSort] = useState<Sort>("destaques");
  const fetchProducts = useServerFn(listCategoryProducts);

  const { data, isPending, isError } = useQuery({
    queryKey: ["catalogo", slug],
    queryFn: () => fetchProducts({ data: { slug: slug as CatalogCategorySlug } }),
    enabled: Boolean(cat),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const remote = data?.products ?? [];
  // Fallback: se a integração falhar (ou não houver retorno), mostramos o catálogo local
  const useFallback =
    isError || data?.source === "fallback" || (!isPending && remote.length === 0);

  const notice =
    isError || data?.source === "fallback"
      ? "Não foi possível conectar ao catálogo agora. Exibindo peças de exemplo enquanto normalizamos a integração."
      : data?.warning === "bling_nao_configurado"
        ? "Integração com o Bling ainda não configurada — os saldos exibidos são os do nosso banco de dados."
        : data?.warning === "bling_indisponivel"
          ? "Estoque em tempo real do Bling temporariamente indisponível — exibindo os saldos do nosso banco de dados."
          : null;

  const list = useMemo(() => {
    const arr: Product[] = useFallback
      ? getProductsByCategory(slug)
      : remote.map(toProduct);
    const sorted = [...arr];
    if (sort === "menor") sorted.sort((a, b) => a.price - b.price);
    if (sort === "maior") sorted.sort((a, b) => b.price - a.price);
    if (sort === "novos") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [remote, sort, useFallback, slug]);

  if (!cat) {
    return (
      <PageShell eyebrow="Catálogo" title="Categoria não encontrada">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-muted-foreground">Esta categoria não existe.</p>
          <Link to="/" className="mt-6 inline-block story-link text-[12px] tracking-[0.3em] uppercase">
            Voltar para a home
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Catálogo" title={cat.name}>
      <section className="mx-auto max-w-7xl px-6 sm:px-10 py-12 md:py-16">
        {notice && !isPending && (
          <div className="mb-8 rounded-sm border border-nude/40 bg-nude/10 px-5 py-4 text-sm text-muted-foreground">
            {notice}
          </div>
        )}

        {/* Filter row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Carregando peças…"
              : `${list.length} ${list.length === 1 ? "peça disponível" : "peças disponíveis"}`}
          </p>
          <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase">
            <label htmlFor="sort">Ordenar:</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="destaques">Destaques</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="novos">Nome (A–Z)</option>
            </select>
          </div>
        </div>

        {isPending ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Em breve novidades nesta categoria.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12 md:gap-x-8 transition-opacity duration-300">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}


        {/* Other categories */}
        <div className="mt-24 border-t border-border pt-12">
          <p className="text-[11px] tracking-[0.4em] uppercase text-nude-deep text-center">
            Continue explorando
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {categories
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  to="/categoria/$slug"
                  params={{ slug: c.slug }}
                  className="border border-border px-5 py-2 text-[11px] tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
