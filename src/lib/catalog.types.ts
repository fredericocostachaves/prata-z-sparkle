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
