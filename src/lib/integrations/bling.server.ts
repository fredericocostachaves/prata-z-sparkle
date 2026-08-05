export interface BlingProduct {
  id: number;
  codigo: string;
  nome: string;
  preco: number;
  tipo: string;
  situacao: string;
  descricao?: string | null;
  descricaoComplementar?: string | null;
  descricaoCurta?: string | null;
  midia?: {
    imagens?: {
      internas?: { link?: string; url?: string }[];
      externas?: { link?: string; url?: string }[];
    };
  };
}

export interface BlingStockBalance {
  idProduto: number;
  codigo: string;
  nome: string;
  saldoFisicoTotal: number;
  saldoDisponivel: number;
  saldoReservado: number;
}

export interface BlingOrderItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  valor: number;
}

export interface BlingOrderData {
  numero: number;
  data: string;
  contato: { nome: string };
  itens: BlingOrderItem[];
  parcelas?: { valor: number; dataVencimento?: string }[];
}

interface BlingTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

const TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";
const BASE_URL = "https://www.bling.com.br/Api/v3";

/**
 * Converte uma falha de renovação do token do Bling em uma mensagem legível
 * para o usuário, sem expor códigos de erro ou detalhes técnicos da API.
 */
export function formatBlingRefreshError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  const unauthorized =
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("invalid_grant") ||
    lower.includes("token inválido") ||
    lower.includes("expirado") ||
    lower.includes("revogado") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden");

  if (unauthorized) {
    return "A conexão com o Bling expirou. Para continuar, reconecte o Bling em Configurações.";
  }

  return "Não foi possível renovar a conexão com o Bling no momento. Tente novamente em instantes ou reconecte o Bling em Configurações.";
}

class BlingClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt = 0;
  private maxRetries = 3;
  private retryDelay = 1000;
  private userId: string | null = null;

  constructor() {
    this.clientId = process.env.BLING_CLIENT_ID || "";
    this.clientSecret = process.env.BLING_CLIENT_SECRET || "";
  }

  async loadFromDb(supabaseClient?: any, userId?: string): Promise<void> {
    const client = supabaseClient || (await this.getAdminClient());
    if (!client) return;

    try {
      let query = (client as any)
        .from("bling_tokens")
        .select("user_id, access_token, refresh_token, expires_at");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("[Bling] Erro ao consultar bling_tokens:", error.message);
        return;
      }

      if (data) {
        this.userId = data.user_id ?? userId ?? null;
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiresAt = new Date(data.expires_at).getTime();
      }
    } catch (err) {
      console.warn("[Bling] Não foi possível carregar token do banco:", err);
    }
  }

  setTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = expiresAt;
    this.userId = null;
  }

  get hasTokens(): boolean {
    return Boolean(this.accessToken || this.refreshToken);
  }

  get isExpired(): boolean {
    return Date.now() >= this.tokenExpiresAt - 60_000;
  }

  async refreshTokens(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("Refresh token não disponível. Reconecte o Bling em Configurações.");
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Bling token refresh failed: ${response.status} ${JSON.stringify(error)}`);
    }

    const data: BlingTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

    // O refresh_token do Bling é de uso único: cada renovação invalida o
    // anterior. Sem persistir, o próximo request (ex.: outro isolate do
    // Cloudflare Worker) carrega do banco o token já consumido e o refresh
    // falha com invalid_grant — por isso o catálogo ficava sempre
    // "Bling indisponível". Grava os novos tokens para não perder o acesso.
    await this.persistTokens();
  }

  /**
   * Grava os tokens atuais no banco (best-effort). Só persiste quando o token
   * foi carregado via loadFromDb (fluxo do catálogo); os fluxos admin usam
   * setTokens e persistem explicitamente com o user_id do usuário autenticado.
   */
  private async persistTokens(): Promise<void> {
    if (!this.userId) return;
    try {
      const client = await this.getAdminClient();
      if (!client) return;
      await (client as any).from("bling_tokens").upsert(
        {
          user_id: this.userId,
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_at: new Date(this.tokenExpiresAt).toISOString(),
        },
        { onConflict: "user_id" },
      );
    } catch (err) {
      console.warn("[Bling] Não foi possível persistir os tokens renovados:", err);
    }
  }

  private async getAdminClient(): Promise<any> {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      return supabaseAdmin;
    } catch {
      return null;
    }
  }

  getAuthUrl(state: string): string {
    return `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${this.clientId}&state=${state}`;
  }

  async exchangeCode(code: string): Promise<BlingTokenResponse> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Bling token exchange failed: ${response.status} ${error.error || response.statusText}`,
      );
    }

    const data: BlingTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return data;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.loadFromDb();
    }
    if (!this.accessToken) {
      throw new Error("Bling não autorizado. Conecte o Bling no painel administrativo.");
    }
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();

    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
          console.warn(
            `Bling rate limit atingido. Retry ${attempt}/${this.maxRetries} em ${retryAfter}s`,
          );
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData?.error?.message || errorData?.message || response.statusText;
          throw new Error(`Bling API ${response.status}: ${errorMsg}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxRetries) {
          console.warn(
            `Bling request falhou (tentativa ${attempt}/${this.maxRetries}):`,
            lastError.message,
          );
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error("Erro desconhecido na API do Bling");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getProductStock(sku: string): Promise<number> {
    try {
      const data = await this.request<{ data: BlingProduct[] }>(
        `/produtos?codigo=${encodeURIComponent(sku)}`,
      );

      if (!data.data || data.data.length === 0) {
        console.warn(`Produto com SKU ${sku} não encontrado no Bling`);
        return 0;
      }

      const product = data.data[0];
      const stockData = await this.request<{ data: BlingStockBalance[] }>(
        `/estoques/saldos?idsProdutos[]=${product.id}`,
      );

      if (!stockData.data || stockData.data.length === 0) {
        return 0;
      }

      return stockData.data[0].saldoDisponivel || stockData.data[0].saldoFisicoTotal || 0;
    } catch (error) {
      console.error(`Erro ao buscar estoque Bling (SKU: ${sku}):`, error);
      return 0;
    }
  }

  async getStockBalances(productIds: number[]): Promise<Map<number, number>> {
    const stockMap = new Map<number, number>();
    if (productIds.length === 0) return stockMap;

    const batchSize = 50;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const params = batch.map((id) => `idsProdutos[]=${id}`).join("&");
      try {
        const stockData = await this.request<{ data: BlingStockBalance[] }>(
          `/estoques/saldos?${params}`,
        );
        for (const s of stockData.data ?? []) {
          const qty = s.saldoDisponivel ?? s.saldoFisicoTotal ?? 0;
          stockMap.set(s.idProduto, qty);
        }
      } catch (err) {
        console.warn("[Bling] Erro ao buscar estoques em lote:", err);
      }
      if (i + batchSize < productIds.length) await this.sleep(300);
    }
    return stockMap;
  }

  async createOrder(orderData: BlingOrderData) {
    return this.request("/pedidos/vendas", {
      method: "POST",
      body: JSON.stringify(orderData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createProduct(product: any) {
    return this.request("/produtos", {
      method: "POST",
      body: JSON.stringify(product),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async updateProduct(blingId: number, product: any) {
    return this.request(`/produtos/${blingId}`, {
      method: "PUT",
      body: JSON.stringify(product),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async searchProduct(codigo: string): Promise<BlingProduct | null> {
    try {
      const data = await this.request<{ data: BlingProduct[] }>(
        `/produtos?codigo=${encodeURIComponent(codigo)}`,
      );
      return data.data?.[0] ?? null;
    } catch {
      return null;
    }
  }

  /** Detalhe completo de um produto (descrição, mídias, variações, dimensões). */
  async getProductById(id: number): Promise<Record<string, any> | null> {
    try {
      const data = await this.request<{ data: Record<string, any> }>(`/produtos/${id}`);
      return data.data ?? null;
    } catch (err) {
      console.warn("[Bling] Erro ao buscar detalhe do produto:", err);
      return null;
    }
  }

  async listProducts(page = 1, limit = 100): Promise<{ data: BlingProduct[]; total: number }> {
    const data = await this.request<{ data: BlingProduct[] }>(
      `/produtos?pagina=${page}&limite=${limit}&criterio=1&opcoes[]=comMidiaComVariacao&opcoes[]=comDescricaoCurta`,
    );
    const total = data.data?.length ?? 0;
    return { data: data.data ?? [], total };
  }

  async listAllProducts(): Promise<BlingProduct[]> {
    const all: BlingProduct[] = [];
    let page = 1;
    const limit = 100;
    while (true) {
      const { data } = await this.listProducts(page, limit);
      all.push(...data);
      if (data.length < limit) break;
      page++;
      await this.sleep(300);
    }
    return all;
  }

  async uploadProductImage(productId: number, imageUrl: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${BASE_URL}/produtos/${productId}/imagem`;

    // Fetch the image from URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}`);
    }

    const imageBlob = await imageResponse.blob();
    const fileName = imageUrl.split("/").pop() || "produto.jpg";

    // Create form data
    const formData = new FormData();
    formData.append("file", imageBlob, fileName);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || errorData?.message || response.statusText;
      throw new Error(`Bling API ${response.status}: ${errorMsg}`);
    }
  }
}

let _bling: BlingClient | undefined;

export const bling = new Proxy({} as BlingClient, {
  get(_, prop, receiver) {
    if (!_bling) _bling = new BlingClient();
    return Reflect.get(_bling, prop, receiver);
  },
  set(_, prop, value) {
    if (!_bling) _bling = new BlingClient();
    return Reflect.set(_bling, prop, value);
  },
});
