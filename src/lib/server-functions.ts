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
    return await superFrete.calculateShipping(params);
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
  paymentMethod: z.enum(['pix', 'cartao']),
  shippingCost: z.number().min(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  items: z.array(z.object({
    id: z.string(),
    sku: z.string(),
    name: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })),
});

export const finalizeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data: orderData }) => {
    // 1. Criar pedido no Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('pedidos')
      .insert([{
        cliente_id: orderData.cliente_id || null,
        metodo_pagamento: orderData.paymentMethod,
        valor_frete: orderData.shippingCost,
        subtotal: orderData.subtotal,
        valor_total: orderData.total,
        status_pagamento: 'pendente',
        status_logistica: 'aguardando_envio',
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Erro ao criar pedido no Supabase:', orderError);
      throw new Error(`Erro ao criar pedido: ${orderError.message}`);
    }

    // 2. Criar itens no Supabase
    const items = orderData.items.map((it) => ({
      pedido_id: order.id,
      produto_id: it.id,
      quantidade: it.quantity,
      preco_unitario: it.price,
    }));

    const { error: itemsError } = await supabaseAdmin.from('itens_pedido').insert(items);
    if (itemsError) {
      console.error('Erro ao criar itens do pedido:', itemsError);
      throw new Error(`Erro ao criar itens: ${itemsError.message}`);
    }

    // 3. Sincronizar com Bling (best effort - não bloqueia o pedido)
    try {
      await bling.createOrder({
        numero: order.numero,
        data: new Date().toISOString().split('T')[0],
        contato: { nome: orderData.customerName },
        itens: orderData.items.map((it) => ({
          codigo: it.sku,
          descricao: it.name,
          quantidade: it.quantity,
          valor: it.price,
        })),
        parcelas: [
          { valor: order.valor_total }
        ]
      });
      console.log(`Pedido #${order.numero} sincronizado com Bling com sucesso`);
    } catch (err) {
      console.error('Falha ao sincronizar com Bling (pedido criado no Supabase):', err);
    }

    return order;
  });
