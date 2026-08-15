export interface NubankCheckoutParams {
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
    firstName: string;
    lastName: string;
    email: string;
    taxId: string;
    phone?: string;
  };
  items: Array<{
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
    this.apiKey = process.env.NUPAY_API_KEY || '';
    this.apiToken = process.env.NUPAY_API_TOKEN || '';
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
      throw new Error('NUPAY_API_KEY e NUPAY_API_TOKEN não configurados. Adicione em .env');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    headers.set('x-api-key', this.apiKey);
    headers.set('x-api-token', this.apiToken);

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
      returnUrl: `${this.siteUrl}/checkout/retorno?session={sessionId}&reference={reference}`,
      callbackUrl: `${this.siteUrl}/api/webhook/nupay`,
      merchant: {
        name: 'Prata Z Joias',
        logoUrl: `${this.siteUrl}/logo.png`,
      },
      shopper: {
        firstName: params.shopper.firstName,
        lastName: params.shopper.lastName,
        email: params.shopper.email,
        identification: {
          type: 'CPF',
          number: params.shopper.taxId,
        },
        phone: params.shopper.phone,
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
      amount: {
        value: params.amount.value,
        currency: params.amount.currency || 'BRL',
      },
      shopper: {
        firstName: params.shopper.firstName,
        lastName: params.shopper.lastName,
        email: params.shopper.email,
        identification: {
          type: 'CPF',
          number: params.shopper.taxId,
        },
        phone: params.shopper.phone,
      },
      items: params.items,
      paymentFlow: params.paymentFlow || {
        returnUrl: `${this.siteUrl}/conta/pedidos`,
        cancelUrl: `${this.siteUrl}/checkout`,
      },
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
