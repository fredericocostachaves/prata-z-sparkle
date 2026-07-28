import type { CatalogProduct, CatalogProductDetail } from "./catalog.types";
import { slugifySku } from "./catalog.types";

export const SITE_URL = "https://prata-z-sparkle.lovable.app";
export const SITE_NAME = "Prata Z Joias";

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function productPath(p: { sku?: string | null; id: string }) {
  const slug = slugifySku(p.sku ?? "") || p.id;
  return `/produto/${slug}`;
}

function availability(stock: number) {
  return stock >= 1 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

/** JSON-LD Product (schema.org) com oferta, preço e disponibilidade vindos do catálogo/Bling. */
export function productJsonLd(p: CatalogProduct | CatalogProductDetail, url: string) {
  const images = [p.image, ...(p.gallery ?? [])]
    .filter(Boolean)
    .map((i) => absoluteUrl(i as string));
  const detail = p as Partial<CatalogProductDetail>;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    ...(images.length ? { image: images } : {}),
    sku: p.sku || p.id,
    ...(detail.brand ? { brand: { "@type": "Brand", name: detail.brand } } : { brand: { "@type": "Brand", name: SITE_NAME } }),
    ...(p.category ? { category: p.category } : {}),
    ...(detail.weightG
      ? { weight: { "@type": "QuantitativeValue", value: detail.weightG, unitCode: "GRM" } }
      : {}),
    material: "Prata 925",
    url: absoluteUrl(url),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(url),
      priceCurrency: "BRL",
      price: Number(p.price ?? 0).toFixed(2),
      availability: availability(p.stock ?? 0),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

/** JSON-LD ItemList de uma página de categoria, com um Product por posição. */
export function categoryJsonLd(categoryName: string, url: string, products: CatalogProduct[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryName} em prata 925 — ${SITE_NAME}`,
    url: absoluteUrl(url),
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: productJsonLd(p, productPath(p)),
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
