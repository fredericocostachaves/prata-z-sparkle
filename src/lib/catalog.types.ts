export const CATEGORY_SLUGS = [
  "colares",
  "brincos",
  "aneis",
  "pulseiras",
  "pingentes",
  "berloques",
  "piercings",
  "tornozeleiras",
  "cuidados",
] as const;

export type CatalogCategorySlug = (typeof CATEGORY_SLUGS)[number];

/** Ordem das categorias no carrossel "Top de vendas" (A-Z conforme rótulos). */
export const TOP_CATEGORY_ORDER = [
  "cuidados", // Acessórios de cuidados
  "aneis",
  "berloques",
  "braceletes",
  "brincos",
  "colares",
  "piercings",
  "pingentes",
  "pulseiras",
] as const;

/** Estoque mínimo (exclusivo) para uma peça entrar no carrossel. */
export const TOP_MIN_STOCK = 2;

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  gallery: string[];
  description: string | null;
  category: string;
}

/** Motivo pelo qual o estoque em tempo real do Bling não pôde ser usado. */
export type CatalogWarning =
  | "bling_nao_configurado"
  | "bling_indisponivel"
  | "catalogo_indisponivel"
  | null;

export interface CatalogResult {
  products: CatalogProduct[];
  /** origem do saldo exibido */
  source: "bling" | "banco" | "fallback";
  warning: CatalogWarning;
}

export interface CatalogProductDetail extends CatalogProduct {
  /** Informações adicionais vindas do Bling quando disponíveis */
  brand: string | null;
  weightG: number | null;
  dimensions: { height: number | null; width: number | null; length: number | null } | null;
  attributes: { label: string; value: string }[];
  variations: { id: string; name: string; sku: string; price: number; stock: number }[];
}

export interface CatalogDetailResult {
  product: CatalogProductDetail | null;
  source: "bling" | "banco" | "fallback";
  warning: CatalogWarning | "produto_nao_encontrado";
}

export function slugifySku(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
