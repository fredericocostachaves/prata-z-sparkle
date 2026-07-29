import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { categories, getCategory, getProductsByCategory, type Product } from "@/data/products";
import { listCategoryProducts } from "@/lib/catalog.functions";
import { CATEGORY_SLUGS, type CatalogProduct, type CatalogCategorySlug, type CatalogResult } from "@/lib/catalog.types";
import { SITE_URL, categoryJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import catFallback from "@/assets/cat-colar.jpg";

const EMPTY_RESULT: CatalogResult = { products: [], source: "fallback", warning: "catalogo_indisponivel" };

export const Route = createFileRoute("/categoria/$slug")({
  loader: async ({ params }): Promise<CatalogResult> => {
    if (!(CATEGORY_SLUGS as readonly string[]).includes(params.slug)) return EMPTY_RESULT;
    try {
      return await listCategoryProducts({ data: { slug: params.slug as CatalogCategorySlug } });
    } catch {
      return EMPTY_RESULT;
    }
  },
  head: ({ params, loaderData }) => {
    const cat = getCategory(params.slug);
    const name = cat?.name ?? "Catálogo";
    const title = cat
      ? `Comprar ${cat.name} de Prata 925 Femininos | Prata Z Joias`
      : "Catálogo de joias em prata 925 | Prata Z Joias";
    const desc = cat
      ? `${cat.name} em prata 925 legítima com garantia de autenticidade, parcelamento e envio para todo o Brasil. Alta joalheria com atendimento personalizado na Prata Z Joias.`
      : "Alta joalheria em prata 925 com atendimento personalizado. Colares, brincos, anéis, pulseiras e mais.";
    const path = `/categoria/${params.slug}`;
    const url = `${SITE_URL}${path}`;
    const products = loaderData?.products ?? [];
    const cover = products.find((p) => p.image)?.image ?? null;

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(cover
          ? [
              { property: "og:image", content: cover },
              { name: "twitter:image", content: cover },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(categoryJsonLd(name, path, products)),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Início", path: "/" },
              { name, path },
            ]),
          ),
        },
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
  const initial = Route.useLoaderData();
  const cat = getCategory(slug);
  const [sort, setSort] = useState<Sort>("destaques");
  const fetchProducts = useServerFn(listCategoryProducts);

  const { data, isPending, isError, isLoading } = useQuery({
    queryKey: ["catalogo", slug],
    queryFn: () => fetchProducts({ data: { slug: slug as CatalogCategorySlug } }),
    enabled: Boolean(cat),
    staleTime: 60_000,
    initialData: initial,
    placeholderData: (prev) => prev,
    retry: 1,
    retryDelay: 3_000,
    gcTime: 0,
  });


  const remote = data?.products ?? [];
  // Fallback: se a integração falhar, demorar muito ou não houver retorno, mostramos o catálogo local
  const useFallback =
    isError || data?.source === "fallback" || (!isPending && remote.length === 0);

  const fallbackProducts = useMemo(() => getProductsByCategory(slug), [slug]);

  const list = useMemo(() => {
    const arr: Product[] = useFallback
      ? fallbackProducts
      : remote.map(toProduct);
    const sorted = [...arr];
    if (sort === "menor") sorted.sort((a, b) => a.price - b.price);
    if (sort === "maior") sorted.sort((a, b) => b.price - a.price);
    if (sort === "novos") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [remote, sort, useFallback, fallbackProducts]);

  const notice =
    isError || data?.source === "fallback"
      ? "Não foi possível conectar ao catálogo agora. Exibindo peças de exemplo enquanto normalizamos a integração."
      : data?.warning === "bling_nao_configurado"
        ? "Integração com o Bling ainda não configurada — os saldos exibidos são os do nosso banco de dados."
        : data?.warning === "bling_indisponivel"
          ? "Estoque em tempo real do Bling temporariamente indisponível — exibindo os saldos do nosso banco de dados."
          : !isPending && remote.length === 0 && fallbackProducts.length > 0
            ? "Catálogo online indisponível no momento. Exibindo peças de exemplo."
            : null;

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
