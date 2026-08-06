import { bling } from "./integrations/bling.server";
import type { CatalogWarning } from "./catalog.types";

// Cache do mapa de estoque do Bling (SKU -> quantidade disponível).
// Há dois níveis: um em memória (por isolate) e um no banco (compartilhado
// entre todos os isolates). O do banco evita que cada isolate puxe o catálogo
// inteiro do Bling a cada refresh — o que estourava o rate-limit e fazia o
// saldo real-time vir sempre zerado.
let cache: { at: number; map: Map<string, number> } | null = null;
const TTL = 10 * 60 * 1000;

export interface BlingStockResult {
  map: Map<string, number> | null;
  reason: CatalogWarning;
  detail?: string;
}

/** Lê o mapa de estoque em cache no banco (row única). */
async function readCacheFromDb(): Promise<{ at: number; map: Map<string, number> } | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("bling_estoque_cache")
      .select("mapa, atualizado_em")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data?.mapa) return null;
    const entries = Object.entries(data.mapa as Record<string, number>);
    return {
      at: new Date(data.atualizado_em).getTime(),
      map: new Map(entries as [string, number][]),
    };
  } catch (err) {
    console.warn("[Catálogo] Falha ao ler cache de estoque do banco:", err);
    return null;
  }
}

/** Grava o mapa de estoque no banco (row única). */
async function writeCacheToDb(map: Map<string, number>) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const objeto = Object.fromEntries(map.entries());
    await (supabaseAdmin as any)
      .from("bling_estoque_cache")
      .upsert(
        { id: 1, mapa: objeto, atualizado_em: new Date().toISOString() },
        { onConflict: "id" },
      );
  } catch (err) {
    console.warn("[Catálogo] Falha ao gravar cache de estoque no banco:", err);
  }
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
    return { map: null, reason: "bling_nao_configurado", detail: "sem BLING_CLIENT_ID/SECRET" };
  }

  // Cache compartilhado no banco: todos os isolates usam o MESMO mapa, então a
  // API do Bling é chamada só quando o cache expira (1x a cada TTL), não por
  // isolate. Se houver um valor fresco, devolve sem tocar no Bling.
  const dbCache = await readCacheFromDb();
  if (dbCache && Date.now() - dbCache.at < TTL) {
    cache = dbCache;
    return { map: dbCache.map, reason: null };
  }

  try {
    await bling.loadFromDb();
    if (!bling.hasTokens) {
      return { map: null, reason: "bling_nao_configurado", detail: "sem tokens no bling_tokens" };
    }
    if (bling.isExpired) {
      await bling.refreshTokens();
    }

    const produtos = await bling.listAllProducts();
    console.warn(`[Catálogo] Bling: ${produtos.length} produto(s) listados`);
    if (!produtos.length) {
      return {
        map: null,
        reason: "bling_indisponivel",
        detail: "listAllProducts retornou 0 produtos",
      };
    }

    const stock = await bling.getStockBalances(produtos.map((p) => p.id));
    const positives = [...stock.values()].filter((n) => n > 0).length;
    console.warn(
      `[Catálogo] Bling: saldos retornados=${stock.size}, positivos=${positives}, totalProdutos=${produtos.length}`,
    );

    const map = new Map<string, number>();
    for (const p of produtos) {
      const sku = (p.codigo || String(p.id)).trim();
      if (!sku) continue;
      // Casa por SKU (string) primeiro — sabemos que bate com o banco — e por id
      // como fallback, para não depender do tipo/conteúdo do idProduto.
      map.set(sku, stock.get(sku) ?? stock.get(p.id) ?? 0);
    }

    // Se o endpoint de saldos devolveu vazio/zerado, não vale a pena usar este
    // "mapa em tempo real" (resultaria em tudo fora de estoque). Reporta como
    // indisponível para o chamador usar o saldo do banco.
    if (map.size > 0 && positives === 0) {
      const mod = await import("./integrations/bling.server");
      const diag = mod.lastStockBalancesDiag;
      const detail = [
        `saldos zerados (${stock.size} de ${produtos.length})`,
        diag
          ? `rawItens=${diag.rawItens} requestedFound=${diag.requestedFound} achouProcurado=${diag.achouProcurado} procuradoTipo=${diag.procuradoTipo} procurado=${String(diag.procurado)} amostra=${JSON.stringify(diag.amostra)}`
          : "sem diag",
      ].join(" | ");
      console.warn(`[Catálogo] Bling: todos os saldos vieram zerados — ${detail}`);
      return { map: null, reason: "bling_indisponivel", detail };
    }

    cache = { at: Date.now(), map };
    await writeCacheToDb(map);
    return { map, reason: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[Catálogo] Estoque do Bling indisponível, usando banco:", msg);
    // Se houver um cache anterior (mesmo velho), serve ele em vez de esvaziar a vitrine.
    if (dbCache) {
      cache = dbCache;
      return { map: dbCache.map, reason: null };
    }
    return { map: null, reason: "bling_indisponivel", detail: msg };
  }
}

export interface BlingDetail {
  name: string | null;
  code: string | null;
  price: number | null;
  stock: number | null;
  description: string | null;
  descriptionLong: string | null;
  descriptionShort: string | null;

  images: string[];
  brand: string | null;
  weightG: number | null;
  dimensions: { height: number | null; width: number | null; length: number | null } | null;
  attributes: { label: string; value: string }[];
  variations: { id: string; name: string; sku: string; price: number; stock: number }[];
  reason: CatalogWarning;
}

const EMPTY: BlingDetail = {
  name: null,
  code: null,
  price: null,
  stock: null,
  description: null,
  descriptionLong: null,
  descriptionShort: null,

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

    const full =
      (await bling.getProductById(found.id)) ?? (found as unknown as Record<string, any>);
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
      name: (full?.nome ?? found?.nome ?? null) || null,
      code: (full?.codigo ?? sku ?? null) || null,
      price: num(full?.preco),
      stock: stockMap.get(found.id) ?? null,
      description:
        (full?.descricaoComplementar || full?.descricaoCurta || full?.descricao || null) ?? null,
      descriptionLong:
        (full?.descricaoComplementar || full?.descricao || full?.descricaoCurta || null) ?? null,
      descriptionShort: (full?.descricaoCurta || full?.descricao || null) ?? null,
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
