export interface BlingProduct {
  id: number;
  codigo: string;
  nome: string;
  preco: number;
  tipo: string;
  situacao: string;
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

const TOKEN_URL = 'https://www.bling.com.br/Api/v3/oauth/token';
const BASE_URL = 'https://www.bling.com.br/Api/v3';

class BlingClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.clientId = process.env.BLING_CLIENT_ID || '';
    this.clientSecret = process.env.BLING_CLIENT_SECRET || '';
  }

  async loadFromDb(supabaseClient?: any): Promise<void> {
    const client = supabaseClient || await this.getAdminClient();
    if (!client) return;

    try {
      const { data } = await (client as any)
        .from("bling_tokens")
        .select("access_token, refresh_token, expires_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiresAt = new Date(data.expires_at).getTime();
      }
    } catch (err) {
      console.warn("[Bling] Não foi possível carregar token do banco:", err);
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
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Bling token exchange failed: ${response.status} ${error.error || response.statusText}`);
    }

    const data: BlingTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return data;
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('BLING_REFRESH_TOKEN não disponível. Faça a autorização OAuth novamente.');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Bling token refresh failed: ${response.status} ${error.error || response.statusText}`);
    }

    const data: BlingTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin as any).from("bling_tokens").upsert(
        {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(this.tokenExpiresAt).toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (err) {
      console.warn("[Bling] Não foi possível salvar token atualizado:", err);
    }

    return this.accessToken;
  }

  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.loadFromDb();
    }
    if (!this.accessToken) {
      throw new Error('Bling não autorizado. Conecte o Bling no painel administrativo.');
    }
    if (Date.now() >= this.tokenExpiresAt - 60_000) {
      return this.refreshAccessToken();
    }
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();

    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          console.warn(`Bling rate limit atingido. Retry ${attempt}/${this.maxRetries} em ${retryAfter}s`);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.request<T>(endpoint, options);
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
          console.warn(`Bling request falhou (tentativa ${attempt}/${this.maxRetries}):`, lastError.message);
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error('Erro desconhecido na API do Bling');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getProductStock(sku: string): Promise<number> {
    try {
      const data = await this.request<{ data: BlingProduct[] }>(
        `/produtos?codigo=${encodeURIComponent(sku)}`
      );

      if (!data.data || data.data.length === 0) {
        console.warn(`Produto com SKU ${sku} não encontrado no Bling`);
        return 0;
      }

      const product = data.data[0];
      const stockData = await this.request<{ data: BlingStockBalance[] }>(
        `/estoques/saldos?idsProdutos[]=${product.id}`
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

  async createOrder(orderData: BlingOrderData) {
    return this.request('/pedidos/vendas', {
      method: 'POST',
      body: JSON.stringify(orderData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createProduct(product: {
    codigo: string;
    nome: string;
    preco: number;
    tipo?: string;
    situacao?: string;
    estoque?: {
      saldo?: number;
    };
  }) {
    return this.request('/produtos', {
      method: 'POST',
      body: JSON.stringify(product),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async updateProduct(blingId: number, product: {
    codigo?: string;
    nome?: string;
    preco?: number;
    estoque?: {
      saldo?: number;
    };
  }) {
    return this.request(`/produtos/${blingId}`, {
      method: 'PUT',
      body: JSON.stringify(product),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async searchProduct(codigo: string): Promise<BlingProduct | null> {
    try {
      const data = await this.request<{ data: BlingProduct[] }>(
        `/produtos?codigo=${encodeURIComponent(codigo)}`
      );
      return data.data?.[0] ?? null;
    } catch {
      return null;
    }
  }
}

let _bling: BlingClient | undefined;

export const bling = new Proxy({} as BlingClient, {
  get(_, prop, receiver) {
    if (!_bling) _bling = new BlingClient();
    return Reflect.get(_bling, prop, receiver);
  },
});
