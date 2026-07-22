export interface SuperFreteQuoteParams {
  cepDestino: string;
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  valorDeclarado?: number;
  maoPropria?: boolean;
  avisoRecebimento?: boolean;
}

export interface SuperFreteOption {
  id: number;
  name: string;
  price: number;
  discount: number;
  delivery_time: number;
  delivery_range?: { min: number; max: number };
  error?: string;
  original_price?: number;
}

export interface SuperFreteLabelParams {
  pedido_id: string;
  service_id: number;
  cep_destino: string;
  remetente: {
    nome: string;
    cpf_cnpj: string;
    telefone: string;
    email: string;
    endereco: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
    };
  };
}

class SuperFreteClient {
  private token: string;
  private baseUrl: string;
  private userAgent: string;

  constructor() {
    this.token = process.env.SUPERFRETE_TOKEN || '';
    const isProduction = process.env.NODE_ENV === 'production';
    this.baseUrl = isProduction
      ? 'https://api.superfrete.com'
      : 'https://sandbox.superfrete.com';
    this.userAgent = 'PrataZ Joias v1.0 (contato@pratazjoias.com.br)';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('SUPERFRETE_TOKEN não configurado. Adicione o token em .env');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.token}`);
    headers.set('User-Agent', this.userAgent);
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || errorData.error || response.statusText;
      throw new Error(`Super Frete API ${response.status}: ${errorMsg}`);
    }

    return await response.json();
  }

  async calculateShipping(params: SuperFreteQuoteParams): Promise<SuperFreteOption[]> {
    try {
      const body = {
        from: {
          postal_code: (process.env.STORE_CEP || '64000-000').replace(/\D/g, ''),
        },
        to: {
          postal_code: params.cepDestino.replace(/\D/g, ''),
        },
        services: '1,2,17',
        options: {
          own_hand: params.maoPropria ?? false,
          receipt: params.avisoRecebimento ?? false,
          insurance_value: params.valorDeclarado ?? 0,
          use_insurance_value: params.valorDeclarado ? true : false,
        },
        package: {
          height: Math.max(1, Math.round(params.alturaCm)),
          width: Math.max(1, Math.round(params.larguraCm)),
          length: Math.max(1, Math.round(params.comprimentoCm)),
          weight: Math.max(0.1, params.pesoKg),
        },
      };

      const data = await this.request<SuperFreteOption[]>('/api/v0/calculator', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return Array.isArray(data) ? data.filter((opt) => !opt.error) : [];
    } catch (error) {
      console.error('Erro ao calcular frete com Super Frete:', error);
      return [];
    }
  }

  async generateLabel(params: SuperFreteLabelParams): Promise<{ tracking_code: string; label_url: string }> {
    const body = {
      service: params.service_id,
      from: {
        name: params.remetente.nome,
        phone: params.remetente.telefone,
        email: params.remetente.email,
        document: params.remetente.cpf_cnpj,
        address: {
          postal_code: params.remetente.endereco.cep.replace(/\D/g, ''),
          street: params.remetente.endereco.logradouro,
          number: params.remetente.endereco.numero,
          complement: params.remetente.endereco.complemento || '',
          neighborhood: params.remetente.endereco.bairro,
          city: params.remetente.endereco.cidade,
          state: params.remetente.endereco.uf,
        },
      },
      to: {
        postal_code: params.cep_destino.replace(/\D/g, ''),
      },
    };

    return this.request('/api/v1/shipping-labels', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

let _superFrete: SuperFreteClient | undefined;

export const superFrete = new Proxy({} as SuperFreteClient, {
  get(_, prop, receiver) {
    if (!_superFrete) _superFrete = new SuperFreteClient();
    return Reflect.get(_superFrete, prop, receiver);
  },
});
