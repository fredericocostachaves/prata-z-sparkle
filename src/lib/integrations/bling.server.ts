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

class BlingClient {
  private apiKey: string;
  private baseUrl = 'https://www.bling.com.br/Api/v3';
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.apiKey = process.env.BLING_API_KEY || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('BLING_API_KEY não configurada. Adicione a chave em .env');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.apiKey}`);
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
}

let _bling: BlingClient | undefined;

export const bling = new Proxy({} as BlingClient, {
  get(_, prop, receiver) {
    if (!_bling) _bling = new BlingClient();
    return Reflect.get(_bling, prop, receiver);
  },
});
