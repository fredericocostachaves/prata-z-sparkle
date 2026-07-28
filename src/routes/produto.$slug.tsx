import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, ShoppingBag, Truck, ShieldCheck, Gift } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { formatInstallment, formatPrice, getProductBySlug, getProductsByCategory, type Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getProductDetail } from "@/lib/catalog.functions";
import type { CatalogDetailResult, CatalogProductDetail } from "@/lib/catalog.types";
import { SITE_URL, productJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import catFallback from "@/assets/cat-colar.jpg";

const EMPTY_DETAIL: CatalogDetailResult = {
  product: null,
  source: "fallback",
  warning: "catalogo_indisponivel",
};

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params }): Promise<CatalogDetailResult> => {
    try {
      return await getProductDetail({ data: { slug: params.slug } });
    } catch {
      return EMPTY_DETAIL;
    }
  },
  head: ({ params, loaderData }) => {
    const remote = loaderData?.product ?? null;
    const local = getProductBySlug(params.slug);
    const name = remote?.name ?? local?.name ?? null;
    const description =
      remote?.description ??
      local?.description ??
      "Joia em prata 925 legítima com garantia de autenticidade e atendimento personalizado.";
    const price = remote?.price ?? local?.price ?? null;
    const stock = remote?.stock ?? local?.stock ?? 0;
    const image = remote?.gallery?.[0] ?? remote?.image ?? local?.images?.[0] ?? null;
    const title = name
      ? `Comprar ${name} em Prata 925 | Prata Z Joias`
      : "Produto — Prata Z Joias";
    const path = `/produto/${params.slug}`;
    const url = `${SITE_URL}${path}`;
    const category = remote?.category ?? local?.category ?? null;

    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 158) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 158) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description.slice(0, 158) },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        ...(price
          ? [
              { property: "og:price:amount", content: Number(price).toFixed(2) },
              { property: "og:price:currency", content: "BRL" },
              { property: "product:price:amount", content: Number(price).toFixed(2) },
              { property: "product:price:currency", content: "BRL" },
              {
                property: "product:availability",
                content: stock >= 1 ? "in stock" : "out of stock",
              },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ...(name
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify(
                  productJsonLd(
                    remote ?? {
                      id: local?.id ?? params.slug,
                      sku: local?.id ?? params.slug,
                      name,
                      price: price ?? 0,
                      stock,
                      image,
                      gallery: local?.images ?? [],
                      description,
                      category: category ?? "",
                    },
                    path,
                  ),
                ),
              },
            ]
          : []),
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Início", path: "/" },
              ...(category ? [{ name: category, path: `/categoria/${category}` }] : []),
              ...(name ? [{ name, path }] : []),
            ]),
          ),
        },
      ],
    };
  },
  component: ProductPage,
});


function DetailSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-6 sm:px-10 py-10 md:py-16">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 animate-pulse">
        <div className="aspect-square bg-secondary rounded-sm" />
        <div className="space-y-5 pt-6">
          <div className="h-3 w-24 bg-secondary rounded-sm" />
          <div className="h-8 w-3/4 bg-secondary rounded-sm" />
          <div className="h-6 w-1/3 bg-secondary rounded-sm" />
          <div className="h-24 w-full bg-secondary rounded-sm" />
          <div className="h-12 w-full bg-secondary rounded-sm" />
        </div>
      </div>
    </section>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  const local = getProductBySlug(slug);
  const navigate = useNavigate();
  const cart = useCart();
  const fav = useFavorites();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  const fetchDetail = useServerFn(getProductDetail);
  const { data, isPending, isError } = useQuery({
    queryKey: ["produto", slug],
    queryFn: () => fetchDetail({ data: { slug } }),
    staleTime: 60_000,
    initialData: initial,
    retry: 1,

  });

  const remote: CatalogProductDetail | null = (data?.product as CatalogProductDetail | null) ?? null;

  const product: Product | undefined = useMemo(() => {
    if (remote) {
      const images = remote.gallery.length ? remote.gallery : [catFallback];
      return {
        id: remote.id,
        slug,
        name: remote.name,
        category: (remote.category || local?.category || "colares") as Product["category"],
        price: remote.price,
        images,
        description: remote.description ?? "",
        highlights: local?.highlights ?? [],
        sizes: local?.sizes,
        stock: remote.stock,
      };
    }
    return local;
  }, [remote, local, slug]);

  const [size, setSize] = useState<string | undefined>(local?.sizes?.[0]);
  const stock = remote?.stock ?? product?.stock;
  const stockLoading = isPending && !local;

  const notice =
    isError || data?.warning === "catalogo_indisponivel"
      ? "Não foi possível conectar ao catálogo agora. Exibindo as informações que temos em cache."
      : data?.warning === "bling_nao_configurado"
        ? "Integração com o Bling ainda não configurada — informações exibidas a partir do nosso banco de dados."
        : data?.warning === "bling_indisponivel"
          ? "Dados em tempo real do Bling temporariamente indisponíveis — exibindo as informações do nosso banco."
          : null;

  if (isPending && !local) return <PageShell hideHero><DetailSkeleton /></PageShell>;

  if (!product) {
    return (
      <PageShell eyebrow="Produto" title="Produto não encontrado">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-muted-foreground">
            Não localizamos esta peça no catálogo. Ela pode ter sido vendida ou estar temporariamente
            indisponível.
          </p>
          <Link to="/" className="mt-6 inline-block story-link text-[12px] tracking-[0.3em] uppercase">
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
        {notice && (
          <div className="mb-8 rounded-sm border border-nude/40 bg-nude/10 px-5 py-4 text-sm text-muted-foreground">
            {notice}
          </div>
        )}
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
                width="900"
                height="900"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                sizes="(min-width: 1024px) 50vw, 100vw"
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
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width="200"
                    height="200"
                    sizes="120px"
                    className="h-full w-full object-cover"
                  />
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
            
            <div className="mt-2 flex items-center gap-2">
              {stockLoading ? (
                <div className="h-4 w-24 bg-secondary animate-pulse rounded" />
              ) : stock !== undefined ? (
                <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded ${stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {stock > 0 ? `Em estoque (${stock} unidades)` : 'Indisponível'}
                </span>
              ) : null}
            </div>

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

            {remote && remote.variations.length > 0 && (
              <div className="mt-10">
                <p className="text-[11px] tracking-[0.3em] uppercase text-foreground/70 mb-3">
                  Variações disponíveis
                </p>
                <div className="flex flex-wrap gap-2">
                  {remote.variations.map((v) => (
                    <span
                      key={v.id || v.sku}
                      className="border border-border px-4 py-2 text-sm text-muted-foreground"
                    >
                      {v.name || v.sku}
                      {v.stock > 0 ? ` · ${v.stock} un.` : " · esgotado"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {remote && (remote.attributes.length > 0 || remote.weightG || remote.dimensions) && (
              <div className="mt-10 border-t border-border pt-8">
                <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">
                  Características
                </p>
                <dl className="mt-4 divide-y divide-border text-sm">
                  {remote.attributes.map((a) => (
                    <div key={a.label} className="flex justify-between gap-6 py-2.5">
                      <dt className="text-muted-foreground">{a.label}</dt>
                      <dd className="text-foreground text-right">{a.value}</dd>
                    </div>
                  ))}
                  {remote.weightG ? (
                    <div className="flex justify-between gap-6 py-2.5">
                      <dt className="text-muted-foreground">Peso</dt>
                      <dd className="text-foreground">{remote.weightG} g</dd>
                    </div>
                  ) : null}
                  {remote.dimensions &&
                  (remote.dimensions.height || remote.dimensions.width || remote.dimensions.length) ? (
                    <div className="flex justify-between gap-6 py-2.5">
                      <dt className="text-muted-foreground">Dimensões (A×L×C)</dt>
                      <dd className="text-foreground">
                        {[remote.dimensions.height, remote.dimensions.width, remote.dimensions.length]
                          .map((n) => (n ? `${n}` : "—"))
                          .join(" × ")} cm
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            )}

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

        {/* Editorial content blocks (placeholder until Bling integration) */}
        <section className="mt-24 grid lg:grid-cols-3 gap-8 border-t border-border pt-16">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Sobre a peça</p>
            <h2 className="mt-3 text-2xl font-serif text-foreground">Detalhes que fazem a diferença</h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Cada {product.name.toLowerCase()} é produzida em prata esterlina 925, com selo de
              autenticidade gravado e acabamento à mão por nossas joalheiras parceiras. Uma peça
              pensada para acompanhar você do dia a dia aos momentos mais especiais.
            </p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Composição</p>
            <h2 className="mt-3 text-2xl font-serif text-foreground">Materiais & acabamento</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Liga: prata 925 (92,5% prata pura)</li>
              <li>• Acabamento: polido espelhado</li>
              <li>• Banho protetor antiescurecimento</li>
              <li>• Hipoalergênico e nickel-free</li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Como cuidar</p>
            <h2 className="mt-3 text-2xl font-serif text-foreground">Para durar por gerações</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Guarde em local seco, longe da umidade</li>
              <li>• Evite contato com perfumes e cremes</li>
              <li>• Limpe com flanela específica para prata</li>
              <li>• Retire ao dormir, nadar ou se exercitar</li>
            </ul>
          </div>
        </section>

        {/* Story block */}
        <section className="mt-20 grid lg:grid-cols-2 gap-12 items-center bg-secondary/40 rounded-sm p-8 md:p-14">
          <div className="aspect-[4/5] bg-gradient-to-br from-nude-soft to-secondary rounded-sm flex items-center justify-center overflow-hidden">
            <img
              src={product.images[1] ?? product.images[0]}
              alt=""
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width="800"
              height="1000"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">A história por trás</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-serif text-foreground">
              Joias que celebram <em className="not-italic italic">você</em>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Na Prata Z acreditamos que uma joia vai muito além do brilho. Ela carrega memórias,
              afetos e a delicadeza de gestos cotidianos. Cada peça é selecionada com curadoria
              cuidadosa para entregar significado, conforto e elegância atemporal.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Nosso compromisso é com a autenticidade — por isso oferecemos garantia vitalícia
              de troca de fechos e ajustes, além de atendimento individual quando você desejar.
            </p>
            <Link
              to="/sobre"
              className="mt-8 inline-block story-link text-[12px] tracking-[0.3em] uppercase"
            >
              Conheça a Prata Z
            </Link>
          </div>
        </section>

        {/* Service highlights */}
        <section className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Envio para todo o Brasil", desc: "Frete grátis acima de R$ 299, entregas seguras com rastreio." },
            { title: "Parcele em até 4x", desc: "Sem juros no cartão de crédito ou 5% off no Pix." },
            { title: "Garantia vitalícia", desc: "Troca de fechos e pequenos ajustes para sempre." },
            { title: "Embalagem premium", desc: "Caixa rígida assinada e cartão para presentear." },
          ].map((item) => (
            <div key={item.title} className="border border-border p-6 rounded-sm">
              <h3 className="font-serif text-lg text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

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
