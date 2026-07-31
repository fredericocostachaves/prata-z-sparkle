import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { nubank } from '@/lib/integrations/nubank.server';

type StatusPagamento = 'pendente' | 'pago' | 'cancelado';

function mapPaymentStatus(status: string): StatusPagamento | null {
  switch (status) {
    case 'COMPLETED':
    case 'AUTHORIZED':
      return 'pago';
    case 'CANCELLED':
    case 'ERROR':
      return 'cancelado';
    default:
      return null;
  }
}

async function findPedidoByNumero(numero: string | number) {
  const parsed = parseInt(String(numero), 10);
  if (!parsed) return null;
  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .select('id, numero, status_pagamento, valor_total')
    .eq('numero', parsed)
    .single();

  if (error || !data) {
    console.error('[NuPay Webhook] Pedido não encontrado:', numero, error);
    return null;
  }
  return data;
}

async function updatePedidoStatus(pedidoId: string, status: StatusPagamento) {
  const { error } = await supabaseAdmin
    .from('pedidos')
    .update({ status_pagamento: status })
    .eq('id', pedidoId);

  if (error) {
    console.error('[NuPay Webhook] Erro ao atualizar pedido:', error);
    throw error;
  }
}

async function createPaymentForSession(session: {
  id: string;
  reference: string;
  approvalCode?: string;
  shopper?: { identification?: { value?: string } };
}) {
  const pedido = await findPedidoByNumero(session.reference);
  if (!pedido) {
    throw new Error(`Pedido não encontrado para a referência ${session.reference}`);
  }

  if (!session.approvalCode) {
    console.warn('[NuPay Webhook] Sessão aprovada sem approvalCode, cobrança não criada');
    return;
  }

  const cpf = session.shopper?.identification?.value?.replace(/\D/g, '');
  if (!cpf) {
    console.warn('[NuPay Webhook] Sessão sem CPF do comprador, cobrança não criada');
    return;
  }

  const { data: itens, error: itensError } = await supabaseAdmin
    .from('itens_pedido')
    .select('quantidade, preco_unitario, produtos(id, nome, sku)')
    .eq('pedido_id', pedido.id);

  if (itensError) {
    console.error('[NuPay Webhook] Erro ao buscar itens do pedido:', itensError);
    throw itensError;
  }

  const items = (itens ?? []).map((it) => ({
    id: String(it.produtos?.sku ?? it.produtos?.id ?? it.preco_unitario),
    name: it.produtos?.nome ?? 'Item do pedido',
    quantity: it.quantidade,
    unitAmount: it.preco_unitario,
  }));

  const siteUrl = process.env.SITE_URL || 'https://pratazjoias.com.br';

  const payment = await nubank.createPayment({
    merchantOrderReference: session.reference,
    referenceId: session.id,
    approvalCode: session.approvalCode,
    amount: {
      value: pedido.valor_total,
      currency: 'BRL',
    },
    shopper: {
      taxId: cpf,
    },
    items,
    paymentFlow: {
      returnUrl: `${siteUrl}/checkout/retorno`,
      cancelUrl: `${siteUrl}/checkout`,
    },
  });

  console.log('[NuPay Webhook] Pagamento criado:', payment);
}

export const Route = createFileRoute('/api/webhook/nupay')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));

          const sessionId: string | undefined = body.sessionId;
          const reference: string | undefined =
            body.reference || body.merchantOrderReference || body.referenceId;

          console.log('[NuPay Webhook] Recebido:', body);

          // Notificação de status de pagamento
          if (body.status && (reference || body.referenceId)) {
            const status = mapPaymentStatus(body.status);
            if (status) {
              let pedido = await findPedidoByNumero(reference || body.referenceId);
              const refId: string | undefined = body.referenceId;
              if (!pedido && refId) {
                // referenceId é o id da sessão (UUID): resolve a referência via API
                try {
                  const sessao = await nubank.getCheckoutSession(refId);
                  if (sessao?.reference) pedido = await findPedidoByNumero(sessao.reference);
                } catch (err) {
                  console.warn('[NuPay Webhook] Não foi possível resolver a sessão do pagamento:', err);
                }
              }
              if (pedido) await updatePedidoStatus(pedido.id, status);
            }
            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          if (!sessionId && !reference) {
            console.error('[NuPay Webhook] sessionId ou reference não fornecido');
            return new Response(JSON.stringify({ error: 'Missing sessionId or reference' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // Consultar status da sessão no NuPay
          const session = sessionId
            ? await nubank.getCheckoutSession(sessionId)
            : await nubank.getCheckoutByReference(reference!);

          console.log('[NuPay Webhook] Status da sessão:', session.status);

          switch (session.status) {
            case 'approved':
              // Comprador aprovou no app: criar a cobrança de fato
              await createPaymentForSession(session);
              break;

            case 'completed':
              // Pagamento criado com o approvalCode da sessão
              if (session.reference) {
                const pedido = await findPedidoByNumero(session.reference);
                if (pedido) await updatePedidoStatus(pedido.id, 'pago');
              }
              break;

            case 'canceled':
            case 'expired':
              if (session.reference) {
                const pedido = await findPedidoByNumero(session.reference);
                if (pedido) await updatePedidoStatus(pedido.id, 'cancelado');
              }
              break;

            default:
              // 'pending' ou status desconhecido: nada a fazer
              break;
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
