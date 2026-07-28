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
