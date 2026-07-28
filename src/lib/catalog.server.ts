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
