import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/superfrete/calcular')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          // Tentar ler de várias fontes de env
          const token = process.env.SUPERFRETE_TOKEN
            || process.env.SECRET_SUPERFRETE_TOKEN
            || process.env.VITE_SUPERFRETE_TOKEN
            || '';
          console.log('[SuperFrete] token setado:', !!token, '| comprimento:', token.length);
          console.log('[SuperFrete] STORE_CEP:', process.env.STORE_CEP);
          console.log('[SuperFrete] NODE_ENV:', process.env.NODE_ENV);
          const storeCep = (process.env.STORE_CEP || '08020-000').replace(/\D/g, '');
          const isProduction = process.env.NODE_ENV === 'production';
          const baseUrl = isProduction
            ? 'https://api.superfrete.com'
            : 'https://sandbox.superfrete.com';

          if (!token) {
            return Response.json({ error: 'SUPERFRETE_TOKEN não configurado' }, { status: 500 });
          }

          const res = await fetch(`${baseUrl}/api/v0/calculator`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
              'User-Agent': 'PrataZ Joias v1.0 (contato@pratazjoias.com.br)',
            },
            body: JSON.stringify({
              from: { postal_code: storeCep },
              to: { postal_code: body.cepDestino.replace(/\D/g, '') },
              services: '1,2,17',
              options: {
                own_hand: false,
                receipt: false,
                insurance_value: body.valorDeclarado ?? 0,
                use_insurance_value: body.valorDeclarado ? true : false,
              },
              package: {
                height: Math.max(1, Math.round(body.alturaCm)),
                width: Math.max(1, Math.round(body.larguraCm)),
                length: Math.max(1, Math.round(body.comprimentoCm)),
                weight: Math.max(0.1, body.pesoKg),
              },
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            console.error('[SuperFrete API] Error:', data);
            return Response.json({ error: data.message || data.error || 'Erro ao calcular frete' }, { status: res.status });
          }

          return Response.json(data);
        } catch (error: any) {
          console.error('[SuperFrete API] Exception:', error);
          return Response.json({ error: error.message }, { status: 500 });
        }
      },
    },
  },
});
