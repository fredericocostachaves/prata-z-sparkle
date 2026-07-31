export interface NubankCheckoutParams {
  /** Valor do pedido em reais (BRL), ex.: 150.5 para R$ 150,50 */
  amount: number;
  reference: string;
  shopper: {
    firstName: string;
    lastName: string;
    email: string;
    taxId: string;
    phone: string;
  };
}

export interface NubankCheckoutResponse {
  id: string;
  reference: string;
  status: 'pending' | 'approved' | 'completed' | 'canceled' | 'expired';
  redirectUrl: string;
  createdAt: string;
  expiresAt: string;
  approvalCode?: string;
  selectedPaymentOption?: string;
  shopper?: {
    identification?: {
      type?: string;
      value?: string;
    };
  };
}

export interface NubankPaymentParams {
  merchantOrderReference: string;
  referenceId: string;
  approvalCode: string;
  amount: {
    value: number;
    currency: string;
  };
  shopper: {
    firstName?: string;
    lastName?: string;
    email?: string;
    taxId: string;
    phone?: string;
  };
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    unitAmount: number;
  }>;
  paymentFlow?: {
    returnUrl: string;
    cancelUrl: string;
  };
}

class NubankClient {
  private apiKey: string;
  private apiToken: string;
  private baseUrl: string;
  private siteUrl: string;

  constructor() {
    this.apiKey = process.env.NUPAY_MERCHANT_KEY || '';
    this.apiToken = process.env.NUPAY_MERCHANT_TOKEN || '';
    const isProduction = process.env.NODE_ENV === 'production';
    this.baseUrl = isProduction
      ? 'https://api.spinpay.com.br'
      : 'https://sandbox-api.spinpay.com.br';
    this.siteUrl = process.env.SITE_URL || 'https://pratazjoias.com.br';
  }

  private getHeaders(): Headers {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey || !this.apiToken) {
      throw new Error(
        'NUPAY_MERCHANT_KEY e NUPAY_MERCHANT_TOKEN não configurados. Adicione em .env'
      );
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    headers.set('X-Merchant-Key', this.apiKey);
    headers.set('X-Merchant-Token', this.apiToken);

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || errorData.error || response.statusText;
      throw new Error(`NuPay API ${response.status}: ${errorMsg}`);
    }

    return await response.json();
  }

  async createCheckout(params: NubankCheckoutParams): Promise<NubankCheckoutResponse> {
    const body = {
      currency: 'BRL',
      reference: params.reference,
      amount: params.amount,
      returnUrl: `${this.siteUrl}/checkout/retorno`,
      callbackUrl: `${this.siteUrl}/api/webhook/nupay`,
      merchant: {
        displayName: 'Prata Z Joias',
      },
      shopper: {
        identification: {
          type: 'CPF',
          value: params.shopper.taxId,
        },
      },
      expiresInMinutes: 30,
    };

    return this.request<NubankCheckoutResponse>('/v1/checkouts/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getCheckoutSession(sessionId: string): Promise<NubankCheckoutResponse> {
    return this.request<NubankCheckoutResponse>(`/v1/checkouts/sessions/${sessionId}`);
  }

  async getCheckoutByReference(reference: string): Promise<NubankCheckoutResponse> {
    return this.request<NubankCheckoutResponse>(
      `/v1/checkouts/sessions/by-reference/${encodeURIComponent(reference)}`
    );
  }

  async createPayment(params: NubankPaymentParams) {
    const body = {
      merchantOrderReference: params.merchantOrderReference,
      referenceId: params.referenceId,
      approvalCode: params.approvalCode,
      amount: {
        value: params.amount.value,
        currency: params.amount.currency || 'BRL',
      },
      paymentMethod: {
        type: 'nupay',
        authorizationType: 'manually_authorized',
      },
      shopper: {
        ...(params.shopper.firstName ? { firstName: params.shopper.firstName } : {}),
        ...(params.shopper.lastName ? { lastName: params.shopper.lastName } : {}),
        ...(params.shopper.email ? { email: params.shopper.email } : {}),
        document: params.shopper.taxId,
        documentType: 'CPF',
        ...(params.shopper.phone
          ? { phone: { country: '55', number: params.shopper.phone } }
          : {}),
      },
      items: params.items.map((it) => ({
        id: String(it.id ?? it.name),
        description: it.name,
        value: it.unitAmount,
        quantity: it.quantity,
      })),
      paymentFlow: params.paymentFlow || {
        returnUrl: `${this.siteUrl}/conta/pedidos`,
        cancelUrl: `${this.siteUrl}/checkout`,
      },
      callbackUrl: `${this.siteUrl}/api/webhook/nupay`,
    };

    return this.request('/v1/checkouts/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

let _nubank: NubankClient | undefined;

export const nubank = new Proxy({} as NubankClient, {
  get(_, prop, receiver) {
    if (!_nubank) _nubank = new NubankClient();
    return Reflect.get(_nubank, prop, receiver);
  },
});
