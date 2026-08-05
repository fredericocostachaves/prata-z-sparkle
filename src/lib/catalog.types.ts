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
  descriptionLong: string | null;
  descriptionShort: string | null;
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

/**
 * Palavras-chave (sem acento, minúsculas) usadas para classificar um produto
 * na categoria correta quando a coluna `categoria` ainda não foi preenchida.
 * A ordem das regras importa: categorias mais específicas vêm primeiro.
 */
const CATEGORY_KEYWORDS: Record<CatalogCategorySlug, string[]> = {
  tornozeleiras: ["tornozeleira", "anklet", "corrente de tornozelo", "corrente para o pe", "no pe"],
  piercings: ["piercing", "helix", "tragus", "septum", "barbell", "piercings de prata"],
  berloques: ["berloque", "charm", "charms", "pingente para pulseira"],
  aneis: ["anel", "alianca", "aliança", "solitario", "solitário", "falange", "aneis"],
  brincos: ["brinco", "brincos", "argola", "argolas", "ear cuff", "earcuff", "ear cuffs", "solitario de orelha"],
  colares: ["colar", "colares", "choker", "gargantilha", "gargantilhas", "torchon", "escapulario", "escapulário", "terco", "terço"],
  pulseiras: ["pulseira", "bracelete", "braceletes", "riviera", "cubano", "pulseiras"],
  pingentes: ["pingente", "pingentes", "simbolo", "símbolo", "medalha"],
  cuidados: ["flanela", "liquido", "líquido", "limpeza", "polimento", "polish", "cuidados"],
};

/** Palavras-chave para busca em banco (sem acento) quando a categoria está vazia. */
const CATEGORY_SEARCH_KEYWORDS: Record<CatalogCategorySlug, string[]> = {
  tornozeleiras: ["tornozeleira", "anklet"],
  piercings: ["piercing", "helix", "tragus", "septum"],
  berloques: ["berloque", "charm"],
  aneis: ["anel", "aliança", "alianca", "solitário", "solitario", "falange"],
  brincos: ["brinco", "argola", "ear cuff", "earcuff"],
  pulseiras: ["pulseira", "bracelete", "riviera", "cubano"],
  pingentes: ["pingente"],
  colares: ["colar", "choker", "gargantilha", "torchon"],
  cuidados: ["flanela", "liquido", "líquido", "limpeza", "polimento", "cuidados"],
};

function normalizeText(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(v: string) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Classifica um produto em uma das categorias do site usando o nome e a
 * descrição. Vence a categoria cuja palavra-chave aparecer primeiro no texto
 * (nome vem antes da descrição), pois descrições costumam citar outras
 * categorias ("combine com brincos e pulseiras") só no final. Retorna `null`
 * quando nenhuma palavra-chave bate.
 */
export function categorizeProduct(nome: string | null | undefined, descricao: string | null | undefined) {
  const text = normalizeText(`${nome ?? ""} ${descricao ?? ""}`);
  if (!text.trim()) return null;

  let best: { idx: number; slug: CatalogCategorySlug } | null = null;
  for (const slug of Object.keys(CATEGORY_KEYWORDS) as CatalogCategorySlug[]) {
    for (const kw of CATEGORY_KEYWORDS[slug]) {
      const m = text.match(new RegExp(`(?:^|[^a-z0-9])${escapeRegex(normalizeText(kw))}(?:$|[^a-z0-9])`));
      if (m && m.index !== undefined && (!best || m.index < best.idx)) {
        best = { idx: m.index, slug };
      }
    }
  }
  return best?.slug ?? null;
}

/**
 * Palavras-chave de busca de uma categoria, para consultas SQL (ilike).
 */
export function categorySearchKeywords(slug: CatalogCategorySlug) {
  return CATEGORY_SEARCH_KEYWORDS[slug] ?? [];
}

export interface BestSellerGroup {
  slug: CatalogCategorySlug;
  products: CatalogProduct[];
}

export interface BestSellersResult {
  groups: BestSellerGroup[];
  source: "bling" | "banco" | "fallback";
  warning: CatalogWarning;
}

/**
 * Título de exibição: código (SKU) do Bling seguido do nome do produto.
 * Evita duplicar o código quando o nome do Bling já começa com ele.
 */
export function formatProductTitle(sku: string | null | undefined, name: string | null | undefined) {
  const code = (sku ?? "").trim();
  const title = (name ?? "").trim();
  if (!code) return title;
  if (!title) return code;
  if (title.toLowerCase().startsWith(code.toLowerCase())) return title;
  return `${code} ${title}`;
}
