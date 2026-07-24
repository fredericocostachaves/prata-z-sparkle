import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureStaff(context: { supabase: any; userId: string }) {
  const { data: roles } = await (context.supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);

  const roleNames = (roles ?? []).map((r: any) => r.role);
  const isAdmin = roleNames.includes("admin");
  const isStaff = roleNames.includes("staff");
  if (!isAdmin && !isStaff) throw new Error("Acesso negado — somente admin/staff.");
  return { isAdmin };
}

// ============ ROLE CHECK ============
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await (context.supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const roleNames = (roles ?? []).map((r: any) => r.role);
    return {
      isAdmin: roleNames.includes("admin"),
      isStaff: roleNames.includes("staff"),
    };
  });

export const promoteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    user_id: z.string().uuid(),
    role: z.enum(["admin", "staff", "cliente"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { error } = await context.supabase.rpc("promote_user", {
      _user_id: data.user_id,
      _role: data.role,
    });
    if (error) throw new Error(`Erro ao promover usuário: ${error.message}`);
    return { ok: true };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("user_id, role");
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, email, full_name");

    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    }

    return (profiles ?? []).map((p: any) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      roles: roleMap.get(p.id) ?? [],
    }));
  });

// ============ BLING OAUTH ============

export const getBlingAuthUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { bling } = await import("./integrations/bling.server");
    const state = crypto.randomUUID();
    return { url: bling.getAuthUrl(state) };
  });

export const exchangeBlingCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().min(1), state: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);

    const { bling } = await import("./integrations/bling.server");
    const tokenData = await bling.exchangeCode(data.code);

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const { error } = await (context.supabase as any).from("bling_tokens").upsert(
      {
        user_id: context.userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
      },
      { onConflict: "user_id" }
    );

    if (error) throw new Error(`Erro ao salvar token: ${error.message}`);

    return { ok: true };
  });

export const getBlingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);

    const { data, error } = await (context.supabase as any)
      .from("bling_tokens")
      .select("expires_at, created_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error || !data) return { connected: false };

    return {
      connected: true,
      expiresAt: data.expires_at,
      connectedAt: data.created_at,
    };
  });

// ============ DASHBOARD ============
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const startMonth = new Date();
    startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);

    const [pedidosMes, todosClientes, topProdutos, pagamentos, evolucao] = await Promise.all([
      context.supabase.from("pedidos").select("valor_total, metodo_pagamento, status_pagamento, data_compra").gte("data_compra", startMonth.toISOString()),
      context.supabase.from("clientes").select("id", { count: "exact", head: true }),
      context.supabase.from("itens_pedido").select("produto_id, quantidade, produtos(nome, sku)").limit(500),
      context.supabase.from("pedidos").select("metodo_pagamento, valor_total").eq("status_pagamento", "pago"),
      context.supabase.from("pedidos").select("data_compra, valor_total").eq("status_pagamento", "pago").gte("data_compra", new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);

    const pagos = (pedidosMes.data ?? []).filter((p: any) => p.status_pagamento === "pago");
    const faturamento = pagos.reduce((s: number, p: any) => s + Number(p.valor_total), 0);
    const ticketMedio = pagos.length ? faturamento / pagos.length : 0;

    // Top produtos
    const map = new Map<string, { nome: string; sku: string; qty: number }>();
    for (const it of topProdutos.data ?? []) {
      const key = it.produto_id;
      const cur = map.get(key) ?? { nome: it.produtos?.nome ?? "-", sku: it.produtos?.sku ?? "", qty: 0 };
      cur.qty += it.quantidade;
      map.set(key, cur);
    }
    const top5 = [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Pagamentos
    const pixTotal = (pagamentos.data ?? []).filter((p: any) => p.metodo_pagamento === "pix").reduce((s: number, p: any) => s + Number(p.valor_total), 0);
    const cartaoTotal = (pagamentos.data ?? []).filter((p: any) => p.metodo_pagamento === "cartao").reduce((s: number, p: any) => s + Number(p.valor_total), 0);

    // Evolução por dia
    const evoMap = new Map<string, number>();
    for (const p of evolucao.data ?? []) {
      const d = new Date(p.data_compra).toISOString().slice(0, 10);
      evoMap.set(d, (evoMap.get(d) ?? 0) + Number(p.valor_total));
    }
    const evolucaoDiaria = [...evoMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([data, total]) => ({ data, total }));

    return {
      kpi: {
        faturamentoMes: faturamento,
        ticketMedio,
        pedidosPagosMes: pagos.length,
        totalClientes: todosClientes.count ?? 0,
      },
      pagamentos: [
        { name: "PIX", value: pixTotal },
        { name: "Cartão", value: cartaoTotal },
      ],
      topProdutos: top5,
      evolucaoDiaria,
    };
  });

// ============ CRUD PRODUTOS ============
export const listProdutos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { data, error } = await context.supabase.from("produtos").select("*, fornecedores(razao_social)").order("nome");
    if (error) throw error;
    return data;
  });

const produtoSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1),
  nome: z.string().min(1),
  descricao: z.string().optional().nullable(),
  preco_custo: z.number().min(0),
  preco_venda: z.number().min(0),
  estoque_atual: z.number().int().min(0),
  estoque_minimo: z.number().int().min(0),
  fornecedor_id: z.string().uuid().optional().nullable(),
  peso_g: z.number().optional().nullable(),
  altura_cm: z.number().optional().nullable(),
  largura_cm: z.number().optional().nullable(),
  comprimento_cm: z.number().optional().nullable(),
  imagem_url: z.string().url().optional().nullable(),
  galeria_urls: z.array(z.string().url()).optional().nullable(),
});

export const upsertProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => produtoSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("produtos").update(rest as any).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("produtos").insert(rest as any);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { error } = await context.supabase.from("produtos").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const syncProdutoBling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ produto_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);

    const { bling } = await import("./integrations/bling.server");

    const { data: tokenRow, error: tokenErr } = await (context.supabase as any)
      .from("bling_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    console.error("[syncProdutoBling] tokenErr:", tokenErr, "tokenRow:", tokenRow ? "FOUND" : "NULL", "userId:", context.userId);

    if (tokenErr) throw new Error(`Erro ao buscar token Bling: ${tokenErr.message}`);
    if (!tokenRow) throw new Error(`Bling não autorizado (userId: ${context.userId}). Conecte o Bling em Configurações.`);

    bling.setTokens(tokenRow.access_token, tokenRow.refresh_token, new Date(tokenRow.expires_at).getTime());

    if (bling.isExpired) {
      try {
        await bling.refreshTokens();
        await (context.supabase as any).from("bling_tokens").upsert(
          {
            user_id: context.userId,
            access_token: (bling as any).accessToken,
            refresh_token: (bling as any).refreshToken,
            expires_at: new Date((bling as any).tokenExpiresAt).toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (refreshErr: any) {
        throw new Error(`Token Bling expirado e refresh falhou: ${refreshErr.message}. Reconecte o Bling em Configurações.`);
      }
    }

    const { data: produto, error } = await context.supabase
      .from("produtos")
      .select("*")
      .eq("id", data.produto_id)
      .single();

    if (error || !produto) throw new Error("Produto não encontrado.");

    const existing = await bling.searchProduct(produto.sku);

    const payload: any = {
      nome: produto.nome,
      codigo: produto.sku,
      tipo: "P",
      formato: "S",
      preco: Number(produto.preco_venda),
      situacao: "A",
    };

    // Add cover image if available (Bling API v3 format)
    const produtoAny = produto as any;
    if (produtoAny.imagem_url) {
      payload.midia = {
        video: { url: "" },
        imagens: {
          imagensURL: [{ link: produtoAny.imagem_url }],
        },
      };
    }

    let result: any;
    if (existing) {
      result = await bling.updateProduct(existing.id, payload);
    } else {
      result = await bling.createProduct(payload);
    }

    const blingId = result?.data?.id ?? existing?.id;

    return { ok: true, bling_id: blingId, action: existing ? "atualizado" : "criado" };
  });

// ============ SYNC BLING -> SUPABASE ============
async function ensureBlingTokens(context: { supabase: any; userId: string }) {
  const { bling } = await import("./integrations/bling.server");

  const { data: tokenRow, error: tokenErr } = await (context.supabase as any)
    .from("bling_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (tokenErr) throw new Error(`Erro ao buscar token Bling: ${tokenErr.message}`);
  if (!tokenRow) throw new Error("Bling não autorizado. Conecte o Bling em Configurações.");

  bling.setTokens(tokenRow.access_token, tokenRow.refresh_token, new Date(tokenRow.expires_at).getTime());

  if (bling.isExpired) {
    try {
      await bling.refreshTokens();
      await (context.supabase as any).from("bling_tokens").upsert(
        {
          user_id: context.userId,
          access_token: (bling as any).accessToken,
          refresh_token: (bling as any).refreshToken,
          expires_at: new Date((bling as any).tokenExpiresAt).toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (refreshErr: any) {
      throw new Error(`Token Bling expirado e refresh falhou: ${refreshErr.message}. Reconecte o Bling em Configurações.`);
    }
  }

  return bling;
}

export const countBlingProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const bling = await ensureBlingTokens(context);
    const products = await bling.listAllProducts();
    return { total: products.length };
  });

export const importBlingBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const bling = await ensureBlingTokens(context);

    const { data: blingProducts } = await bling.listProducts(data.page, data.limit);

    if (blingProducts.length === 0) {
      return { imported: 0, skipped: 0, errors: 0, processed: 0 };
    }

    const productIds = blingProducts.map((p) => p.id);
    const stockMap = await bling.getStockBalances(productIds);

    const { data: existingProdutos } = await context.supabase
      .from("produtos")
      .select("sku");

    const existingSkus = new Set((existingProdutos ?? []).map((p: any) => p.sku));

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const bp of blingProducts) {
      const sku = bp.codigo || `${bp.id}`;

      if (existingSkus.has(sku)) {
        skipped++;
        continue;
      }

      const estoque = stockMap.get(bp.id) ?? 0;

      try {
        const { error } = await context.supabase.from("produtos").insert({
          sku,
          nome: bp.nome,
          preco_venda: Number(bp.preco) || 0,
          estoque_atual: estoque,
          estoque_minimo: 0,
          ativo: bp.situacao === "A",
        });

        if (error) {
          errors++;
        } else {
          imported++;
          existingSkus.add(sku);
        }
      } catch {
        errors++;
      }
    }

    return { imported, skipped, errors, processed: blingProducts.length };
  });

export const countProdutosCadastrados = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { count } = await context.supabase
      .from("produtos")
      .select("sku", { count: "exact", head: true });
    return { total: count ?? 0 };
  });

export const updateStockBlingBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const bling = await ensureBlingTokens(context);

    const { data: blingProducts } = await bling.listProducts(data.page, data.limit);

    if (blingProducts.length === 0) {
      return { updated: 0, notFound: 0, errors: 0, processed: 0 };
    }

    const productIds = blingProducts.map((p) => p.id);
    const stockMap = await bling.getStockBalances(productIds);

    const { data: existingProdutos } = await context.supabase
      .from("produtos")
      .select("id, sku, nome");

    const skuToId = new Map<string, string>();
    const nomeToId = new Map<string, string>();
    for (const p of existingProdutos ?? []) {
      skuToId.set(p.sku, p.id);
      if (p.nome) nomeToId.set(p.nome.toLowerCase().trim(), p.id);
    }

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const bp of blingProducts) {
      const sku = (bp.codigo || "").trim();
      let supabaseId = sku ? skuToId.get(sku) : undefined;

      if (!supabaseId && bp.nome) {
        supabaseId = nomeToId.get(bp.nome.toLowerCase().trim());
      }

      if (!supabaseId) {
        notFound++;
        continue;
      }

      const estoque = stockMap.get(bp.id) ?? 0;

      try {
        const { error } = await context.supabase
          .from("produtos")
          .update({ estoque_atual: estoque })
          .eq("id", supabaseId);

        if (error) {
          errors++;
        } else {
          updated++;
        }
      } catch {
        errors++;
      }
    }

    return { updated, notFound, errors, processed: blingProducts.length };
  });

export const syncProdutoEstoqueBling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ produto_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const bling = await ensureBlingTokens(context);

    const { data: produto, error: prodErr } = await context.supabase
      .from("produtos")
      .select("id, sku, nome")
      .eq("id", data.produto_id)
      .single();

    if (prodErr || !produto) throw new Error("Produto não encontrado.");

    const estoque = await bling.getProductStock(produto.sku);

    const { error } = await context.supabase
      .from("produtos")
      .update({ estoque_atual: estoque })
      .eq("id", produto.id);

    if (error) throw new Error(`Erro ao atualizar estoque: ${error.message}`);

    return { ok: true, estoque, sku: produto.sku };
  });

// ============ CRUD FORNECEDORES ============
export const listFornecedores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { data, error } = await context.supabase.from("fornecedores").select("*").order("razao_social");
    if (error) throw error;
    return data;
  });

const fornecedorSchema = z.object({
  id: z.string().optional(),
  razao_social: z.string().min(1),
  cnpj: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  telefone: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
});

export const upsertFornecedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => fornecedorSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("fornecedores").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("fornecedores").insert(rest);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteFornecedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { error } = await context.supabase.from("fornecedores").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ CLIENTES / CRM ============
export const listClientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { data, error } = await context.supabase.from("clientes").select("*").order("nome_completo");
    if (error) throw error;
    return data;
  });

export const getClienteDetalhe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: cliente, error: e1 } = await context.supabase.from("clientes").select("*").eq("id", data.id).maybeSingle();
    if (e1) throw e1;
    const { data: pedidos, error: e2 } = await context.supabase.from("pedidos").select("*").eq("cliente_id", data.id).order("data_compra", { ascending: false });
    if (e2) throw e2;
    const pagos = (pedidos ?? []).filter((p: any) => p.status_pagamento === "pago");
    const ltv = pagos.reduce((s: number, p: any) => s + Number(p.valor_total), 0);
    const ultimaCompra = pagos[0]?.data_compra ?? null;
    return { cliente, pedidos, ltv, ultimaCompra };
  });

// ============ PEDIDOS ============
export const listPedidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context);
    const { data, error } = await context.supabase
      .from("pedidos")
      .select("*, clientes(nome_completo, email)")
      .order("data_compra", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  });

export const getPedidoDetalhe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: pedido, error } = await context.supabase
      .from("pedidos")
      .select("*, clientes(*), itens_pedido(*, produtos(nome, sku, peso_g, altura_cm, largura_cm, comprimento_cm))")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return pedido;
  });

export const updatePedidoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status_pagamento: z.enum(["pendente", "pago", "cancelado"]).optional(),
      status_logistica: z.enum(["aguardando_envio", "etiqueta_gerada", "enviado", "entregue"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("pedidos").update(rest).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ============ SUPERFRETE ============
export const calcularFrete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      pedido_id: z.string().uuid(),
      cep_destino: z.string().min(8),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    
    const { superFrete } = await import("./integrations/superfrete.server");

    // Soma dimensões/peso dos itens
    const { data: itens } = await context.supabase
      .from("itens_pedido")
      .select("quantidade, produtos(peso_g, altura_cm, largura_cm, comprimento_cm)")
      .eq("pedido_id", data.pedido_id);

    let pesoKg = 0, altura = 2, largura = 11, comprimento = 16;
    for (const it of (itens ?? []) as any[]) {
      pesoKg += ((it.produtos?.peso_g ?? 0) * it.quantidade) / 1000;
      altura = Math.max(altura, it.produtos?.altura_cm ?? 0);
      largura = Math.max(largura, it.produtos?.largura_cm ?? 0);
      comprimento = Math.max(comprimento, it.produtos?.comprimento_cm ?? 0);
    }

    return await superFrete.calculateShipping({
      cepDestino: data.cep_destino,
      pesoKg: pesoKg || 0.3,
      alturaCm: altura || 2,
      larguraCm: largura || 11,
      comprimentoCm: comprimento || 16,
    });
  });

export const gerarEtiqueta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pedido_id: z.string().uuid(), service_id: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    
    // Buscar dados do pedido e cliente para gerar etiqueta
    const { data: pedido, error: pedidoError } = await context.supabase
      .from("pedidos")
      .select("numero, clientes(*)")
      .eq("id", data.pedido_id)
      .single();

    if (pedidoError || !pedido) throw new Error("Pedido não encontrado.");
    if (!pedido.clientes?.cep) throw new Error("Cliente sem CEP cadastrado.");

    // Gerar código de rastreio temporário (será substituído pelo real do SuperFrete)
    const tracking = `SF${Date.now()}`;
    
    const { error } = await context.supabase
      .from("pedidos")
      .update({ tracking_code: tracking, status_logistica: "etiqueta_gerada" })
      .eq("id", data.pedido_id);
    
    if (error) throw error;
    return { tracking_code: tracking, service_id: data.service_id };
  });
