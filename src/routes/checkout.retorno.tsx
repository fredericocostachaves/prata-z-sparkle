import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';

export const Route = createFileRoute('/checkout/retorno')({
  component: CheckoutRetornoPage,
});

function CheckoutRetornoPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'canceled'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state');

    if (state === 'canceled') {
      setStatus('canceled');
      return;
    }

    const session = params.get('session');
    const reference = params.get('reference');

    if (!session && !reference) {
      setStatus('error');
      return;
    }

    const timer = setTimeout(() => {
      setStatus('success');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell eyebrow="Pagamento" title={
      status === 'loading' ? 'Processando pagamento...' :
      status === 'success' ? 'Pagamento confirmado!' :
      status === 'canceled' ? 'Pagamento cancelado' :
      'Erro no processamento'
    }>
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-muted-foreground">
              Seu pagamento foi processado com sucesso!
            </p>
            <p className="text-sm text-muted-foreground">
              Você receberá um e-mail de confirmação em breve.
            </p>
            <a
              href="/conta/pedidos"
              className="inline-block bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition"
            >
              Ver meus pedidos
            </a>
          </div>
        )}

        {status === 'canceled' && (
          <div className="space-y-4">
            <div className="h-16 w-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-muted-foreground">
              O pagamento foi cancelado.
            </p>
            <a
              href="/checkout"
              className="inline-block bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition"
            >
              Tentar novamente
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-muted-foreground">
              Ocorreu um erro ao processar seu pagamento.
            </p>
            <a
              href="/checkout"
              className="inline-block bg-foreground text-background px-6 py-3 text-[12px] tracking-[0.2em] uppercase hover:bg-cta transition"
            >
              Tentar novamente
            </a>
          </div>
        )}
      </section>
    </PageShell>
  );
}
