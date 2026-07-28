import { bling } from "./integrations/bling.server";

// Cache do mapa de estoque do Bling (SKU -> quantidade disponível)
let cache: { at: number; map: Map<string, number> } | null = null;
const TTL = 5 * 60 * 1000;

/**
 * Busca no Bling o saldo de estoque de todos os produtos e devolve um mapa
 * SKU -> quantidade disponível. Em caso de falha (Bling não autorizado, rate
 * limit, etc.) devolve `null` para que o chamador use o estoque do banco.
 */
export async function getBlingStockBySku(): Promise<Map<string, number> | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.map;

  try {
    await bling.loadFromDb();
    if (bling.isExpired) {
      await bling.refreshTokens().catch(() => undefined);
    }

    const produtos = await bling.listAllProducts();
    if (!produtos.length) return null;

    const stock = await bling.getStockBalances(produtos.map((p) => p.id));

    const map = new Map<string, number>();
    for (const p of produtos) {
      const sku = (p.codigo || String(p.id)).trim();
      if (!sku) continue;
      map.set(sku, stock.get(p.id) ?? 0);
    }

    cache = { at: Date.now(), map };
    return map;
  } catch (err) {
    console.warn("[Catálogo] Estoque do Bling indisponível, usando banco:", err);
    return null;
  }
}
