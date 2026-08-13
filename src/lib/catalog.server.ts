import { bling } from "./integrations/bling.server";
import type { CatalogWarning } from "./catalog.types";

// Cache do mapa de estoque do Bling (SKU -> quantidade disponível)
let cache: { at: number; map: Map<string, number> } | null = null;
const TTL = 5 * 60 * 1000;

export interface BlingStockResult {
  map: Map<string, number> | null;
  reason: CatalogWarning;
}

/**
 * Busca no Bling o saldo de estoque de todos os produtos e devolve um mapa
 * SKU -> quantidade disponível. Nunca lança: em caso de credenciais ausentes
 * ou falha de comunicação devolve `map: null` + o motivo, para que o chamador
 * use o estoque do banco e a UI possa avisar o usuário.
 */
export async function getBlingStockBySku(): Promise<BlingStockResult> {
  if (cache && Date.now() - cache.at < TTL) return { map: cache.map, reason: null };

  // OAuth 2.0: sem client id/secret não há como obter nem renovar o access token.
  if (!process.env.BLING_CLIENT_ID || !process.env.BLING_CLIENT_SECRET) {
    console.warn("[Catálogo] Credenciais do Bling não configuradas — usando estoque do banco.");
    return { map: null, reason: "bling_nao_configurado" };
  }

  try {
    await bling.loadFromDb();
    if (!bling.hasTokens) {
      return { map: null, reason: "bling_nao_configurado" };
    }
    if (bling.isExpired) {
      await bling.refreshTokens();
    }

    const produtos = await bling.listAllProducts();
    if (!produtos.length) return { map: null, reason: "bling_indisponivel" };

    const stock = await bling.getStockBalances(produtos.map((p) => p.id));

    const map = new Map<string, number>();
    for (const p of produtos) {
      const sku = (p.codigo || String(p.id)).trim();
      if (!sku) continue;
      map.set(sku, stock.get(p.id) ?? 0);
    }

    cache = { at: Date.now(), map };
    return { map, reason: null };
  } catch (err) {
    console.warn("[Catálogo] Estoque do Bling indisponível, usando banco:", err);
    return { map: null, reason: "bling_indisponivel" };
  }
}

export interface BlingDetail {
  price: number | null;
  stock: number | null;
  description: string | null;
  images: string[];
  brand: string | null;
  weightG: number | null;
  dimensions: { height: number | null; width: number | null; length: number | null } | null;
  attributes: { label: string; value: string }[];
  variations: { id: string; name: string; sku: string; price: number; stock: number }[];
  reason: CatalogWarning;
}

const EMPTY: BlingDetail = {
  price: null,
  stock: null,
  description: null,
  images: [],
  brand: null,
  weightG: null,
  dimensions: null,
  attributes: [],
  variations: [],
  reason: null,
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

/**
 * Detalhe em tempo real de um produto no Bling, buscado pelo SKU (código).
 * Nunca lança: em caso de falha devolve o motivo para o chamador usar o banco.
 */
export async function getBlingProductDetail(sku: string): Promise<BlingDetail> {
  if (!sku) return { ...EMPTY, reason: "bling_indisponivel" };

  if (!process.env.BLING_CLIENT_ID || !process.env.BLING_CLIENT_SECRET) {
    return { ...EMPTY, reason: "bling_nao_configurado" };
  }

  try {
    await bling.loadFromDb();
    if (!bling.hasTokens) return { ...EMPTY, reason: "bling_nao_configurado" };
    if (bling.isExpired) await bling.refreshTokens();

    const found = await bling.searchProduct(sku);
    if (!found) return { ...EMPTY, reason: "bling_indisponivel" };

    const full = (await bling.getProductById(found.id)) ?? (found as unknown as Record<string, any>);
    const stockMap = await bling.getStockBalances([found.id]);

    const images: string[] = [];
    const midia = full?.midia?.imagens;
    for (const group of [midia?.internas, midia?.externas]) {
      for (const img of group ?? []) {
        const url = img?.link ?? img?.url;
        if (url) images.push(url);
      }
    }

    const attributes: { label: string; value: string }[] = [];
    const push = (label: string, value: unknown) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        attributes.push({ label, value: String(value) });
      }
    };
    push("Código (SKU)", full?.codigo);
    push("Marca", full?.marca);
    push("Unidade", full?.unidade);
    push("GTIN", full?.gtin);
    push("Condição", full?.condicao);
    push("Garantia (meses)", full?.garantia);
    push("Observações", full?.observacoes);
    for (const c of full?.camposCustomizados ?? []) {
      push(c?.campo?.nome ?? c?.nome ?? "Característica", c?.valor);
    }

    const variations = (full?.variacoes ?? []).map((v: any) => ({
      id: String(v?.id ?? v?.codigo ?? ""),
      name: String(v?.variacao?.nome ?? v?.nome ?? ""),
      sku: String(v?.codigo ?? ""),
      price: Number(v?.preco) || 0,
      stock: Number(v?.estoque?.saldoVirtualTotal ?? v?.estoque?.quantidade ?? 0) || 0,
    }));

    const dim = full?.dimensoes;

    return {
      price: num(full?.preco),
      stock: stockMap.get(found.id) ?? null,
      description:
        (full?.descricaoComplementar || full?.descricaoCurta || full?.descricao || null) ?? null,
      images,
      brand: full?.marca ?? null,
      weightG: num(full?.pesoBruto ? Number(full.pesoBruto) * 1000 : null),
      dimensions: dim
        ? { height: num(dim?.altura), width: num(dim?.largura), length: num(dim?.profundidade) }
        : null,
      attributes,
      variations,
      reason: null,
    };
  } catch (err) {
    console.warn("[Catálogo] Detalhe do Bling indisponível:", err);
    return { ...EMPTY, reason: "bling_indisponivel" };
  }
}

export interface BlingTopSeller {
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

let topCache: { at: number; items: BlingTopSeller[] } | null = null;
const TOP_TTL = 5 * 60 * 1000;

/**
 * Top de vendas direto do Bling: peças ativas com estoque acima de 2 unidades,
 * com imagens, descrição e preço vindos do ERP. Nunca lança.
 */
export async function getBlingTopSellers(limit = 8): Promise<{ items: BlingTopSeller[]; reason: CatalogWarning }> {
  if (topCache && Date.now() - topCache.at < TOP_TTL) return { items: topCache.items, reason: null };

  if (!process.env.BLING_CLIENT_ID || !process.env.BLING_CLIENT_SECRET) {
    return { items: [], reason: "bling_nao_configurado" };
  }

  try {
    await bling.loadFromDb();
    if (!bling.hasTokens) return { items: [], reason: "bling_nao_configurado" };
    if (bling.isExpired) await bling.refreshTokens();

    const produtos = await bling.listAllProducts();
    if (!produtos.length) return { items: [], reason: "bling_indisponivel" };

    const stock = await bling.getStockBalances(produtos.map((p) => p.id));
    const candidates = produtos
      .filter((p) => (stock.get(p.id) ?? 0) > 2)
      .sort((a, b) => (stock.get(b.id) ?? 0) - (stock.get(a.id) ?? 0))
      .slice(0, limit * 3);

    if (!candidates.length) return { items: [], reason: null };

    const detailed: BlingTopSeller[] = [];
    for (const p of candidates) {
      const full = await bling.getProductById(p.id);
      const midia = full?.midia?.imagens;
      const images: string[] = [];
      for (const group of [midia?.internas, midia?.externas]) {
        for (const img of group ?? []) {
          const url = img?.link ?? img?.url;
          if (url && !images.includes(url)) images.push(url);
        }
      }
      detailed.push({
        id: String(p.id),
        sku: (p.codigo || String(p.id)).trim(),
        name: full?.nome ?? p.nome,
        price: Number(full?.preco ?? p.preco) || 0,
        stock: stock.get(p.id) ?? 0,
        image: images[0] ?? null,
        gallery: images.slice(1),
        description:
          full?.descricaoCurta || full?.descricaoComplementar || full?.descricao || null,
        category: String(full?.categoria?.descricao ?? full?.categoria?.nome ?? "").trim(),
      });
      await new Promise((r) => setTimeout(r, 150));
    }

    // Round-robin por categoria para variar o carrossel
    const byCategory = new Map<string, BlingTopSeller[]>();
    for (const p of detailed) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    const buckets = [...byCategory.values()];
    const items: BlingTopSeller[] = [];
    for (let i = 0; items.length < limit; i++) {
      let added = false;
      for (const b of buckets) {
        if (b[i]) {
          items.push(b[i]);
          added = true;
          if (items.length >= limit) break;
        }
      }
      if (!added) break;
    }

    topCache = { at: Date.now(), items };
    return { items, reason: null };
  } catch (err) {
    console.warn("[Catálogo] Top de vendas do Bling indisponível:", err);
    return { items: [], reason: "bling_indisponivel" };
  }
}
