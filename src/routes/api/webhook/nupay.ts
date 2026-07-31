import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { nubank } from '@/lib/integrations/nubank.server';

export const Route = createFileRoute('/api/webhook/nupay')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { sessionId, reference } = body;

          console.log('[NuPay Webhook] Recebido:', { sessionId, reference });

          if (!sessionId && !reference) {
            console.error('[NuPay Webhook] sessionId ou reference não fornecido');
            return new Response(JSON.stringify({ error: 'Missing sessionId or reference' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // Consultar status da sessão no NuPay
          let session;
          if (sessionId) {
            session = await nubank.getCheckoutSession(sessionId);
          } else {
            session = await nubank.getCheckoutByReference(reference);
          }

          console.log('[NuPay Webhook] Status da sessão:', session.status);

          // Mapear status do NuPay para status do nosso sistema
          let statusPagamento: 'pendente' | 'pago' | 'cancelado' = 'pendente';
          switch (session.status) {
            case 'approved':
            case 'completed':
              statusPagamento = 'pago';
              break;
            case 'canceled':
            case 'expired':
              statusPagamento = 'cancelado';
              break;
            case 'pending':
            default:
              statusPagamento = 'pendente';
              break;
          }

          // Atualizar pedido no Supabase
          const { data: pedido, error: findError } = await supabaseAdmin
            .from('pedidos')
            .select('id, status_pagamento')
            .eq('numero', parseInt(reference, 10))
            .single();

          if (findError || !pedido) {
            console.error('[NuPay Webhook] Pedido não encontrado:', reference, findError);
            return new Response(JSON.stringify({ error: 'Order not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // Só atualiza se o status mudou
          if (pedido.status_pagamento !== statusPagamento) {
            const { error: updateError } = await supabaseAdmin
              .from('pedidos')
              .update({ status_pagamento: statusPagamento })
              .eq('id', pedido.id);

            if (updateError) {
              console.error('[NuPay Webhook] Erro ao atualizar pedido:', updateError);
              return new Response(JSON.stringify({ error: 'Failed to update order' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            console.log(`[NuPay Webhook] Pedido #${reference} atualizado para: ${statusPagamento}`);
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('[NuPay Webhook] Erro:', error);
          return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});
