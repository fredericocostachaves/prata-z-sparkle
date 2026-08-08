import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { bling } from "./integrations/bling.server";
import { superFrete, SuperFreteQuoteParams } from "./integrations/superfrete.server";
import { nubank, NubankCheckoutParams } from "./integrations/nubank.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// --- BLING FUNCTIONS ---

export const getProductStock = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.string().parse(d))
  .handler(async ({ data: sku }) => {
    if (!sku) return 0;
    return await bling.getProductStock(sku);
  });

// --- SUPER FRETE FUNCTIONS ---

export const calculateShipping = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as SuperFreteQuoteParams)
  .handler(async ({ data: params }) => {
    console.log("[calculateShipping] params:", JSON.stringify(params));
    const result = await superFrete.calculateShipping(params);
    console.log("[calculateShipping] result:", JSON.stringify(result));
    return result;
  });

// --- NUBANK FUNCTIONS ---

export const createPaymentSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as NubankCheckoutParams)
  .handler(async ({ data: params }) => {
    return await nubank.createCheckout(params);
  });

export const getPaymentSession = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.string().parse(d))
  .handler(async ({ data: sessionId }) => {
    return await nubank.getCheckoutSession(sessionId);
  });

// --- ORDER PROCESSING ---

const orderSchema = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  customerName: z.string().min(1),
  email: z.string().email(),
  paymentMethod: z.enum(["pix", "cartao"]),
  shippingCost: z.number().min(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  items: z.array(
    z.object({
      id: z.string(),
      sku: z.string(),
      name: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    }),
  ),
});

/**
 * Valida se há estoque disponível para todos os itens do pedido ANTES de criar
 * o pedido. Faz a checagem contra o saldo em tempo real do Bling (SKU -> saldo
 * disponível). Se o Bling não estiver disponível, cai para o estoque do banco.
 * Lança erro descrevendo o(s) item(ns) sem estoque, impedindo a compra de
 * produtos esgotados.
 */
async function resolveAndValidateStock(
  items: { id: string; sku: string; quantity: number }[],
): Promise<Map<string, string>> {
  const skuById = new Map<string, string>();
  if (!items.length) return skuById;

  // Resolve o SKU real de cada produto no banco (o slug/cart não é confiável
  // como código do Bling) e pega o estoque do banco como fallback.
  const ids = items.map((it) => it.id).filter(Boolean);
  const { data: rows, error } = await supabaseAdmin
    .from("produtos")
    .select("id, sku, estoque_atual")
    .in("id", ids);

  // Não bloqueia por falha de leitura do banco; segue sem o fallback.
  if (!error) {
    for (const r of rows ?? []) skuById.set(String(r.id), String(r.sku ?? "").trim());
  }

  const neededBySku = new Map<string, number>();
  const skuByIdResolved = new Map<string, string>();

  for (const it of items) {
    const sku = skuById.get(String(it.id)) || (it.sku ?? "").trim();
    skuByIdResolved.set(String(it.id), sku);
    const key = sku || String(it.id);
    neededBySku.set(key, (neededBySku.get(key) ?? 0) + it.quantity);
  }

  // Saldo real do Bling (SKU -> disponível). null se indisponível/fallback.
  let blingMap: Map<string, number> | null = null;
  try {
    const { getBlingStockBySku } = await import("./catalog.server");
    const res = await getBlingStockBySku();
    blingMap = res.map;
  } catch (err) {
    console.warn("[Estoque] Bling indisponível para validação, usando banco:", err);
  }

  const rowBySku = error ? new Map() : new Map((rows ?? []).map((r) => [String(r.sku).trim(), r]));

  const stockOf = (key: string): number => {
    if (blingMap) {
      const live = blingMap.get(key);
      if (live !== undefined) return live;
    }
    const row = rowBySku.get(key);
    // Sem registro e sem Bling, não há como afirmar que há estoque; não bloqueia.
    if (!row) return Number.MAX_SAFE_INTEGER;
    return Number(row.estoque_atual ?? 0);
  };

  const outOfStock: string[] = [];
  for (const [key, needed] of neededBySku) {
    const available = stockOf(key);
    if (available < needed) outOfStock.push(key);
  }

  if (outOfStock.length) {
    throw new Error(
      `Alguns produtos estão esgotados (sem estoque suficiente) e não puderam ser incluídos no pedido.`,
    );
  }

  return skuByIdResolved;
}

export const finalizeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data: orderData }) => {
    // 0. Validar estoque antes de criar o pedido / cobrar (resolve o SKU real)
    const skuById = await resolveAndValidateStock(orderData.items);

    // 1. Criar pedido no Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from("pedidos")
      .insert([
        {
          cliente_id: orderData.cliente_id || null,
          metodo_pagamento: orderData.paymentMethod,
          valor_frete: orderData.shippingCost,
          subtotal: orderData.subtotal,
          valor_total: orderData.total,
          status_pagamento: "pendente",
          status_logistica: "aguardando_envio",
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Erro ao criar pedido no Supabase:", orderError);
      throw new Error(`Erro ao criar pedido: ${orderError.message}`);
    }

    // 2. Criar itens no Supabase
    const items = orderData.items.map((it) => ({
      pedido_id: order.id,
      produto_id: it.id,
      quantidade: it.quantity,
      preco_unitario: it.price,
    }));

    const { error: itemsError } = await supabaseAdmin.from("itens_pedido").insert(items);
    if (itemsError) {
      console.error("Erro ao criar itens do pedido:", itemsError);
      throw new Error(`Erro ao criar itens: ${itemsError.message}`);
    }

    // 3. Sincronizar com Bling (best effort - não bloqueia o pedido)
    try {
      await bling.createOrder({
        numero: order.numero,
        data: new Date().toISOString().split("T")[0],
        contato: { nome: orderData.customerName },
        itens: orderData.items.map((it) => ({
          codigo: skuById.get(String(it.id)) || it.sku,
          descricao: it.name,
          quantidade: it.quantity,
          valor: it.price,
        })),
        parcelas: [{ valor: order.valor_total }],
      });
      console.log(`Pedido #${order.numero} sincronizado com Bling com sucesso`);
    } catch (err) {
      console.error("Falha ao sincronizar com Bling (pedido criado no Supabase):", err);
    }

    return order;
  });
