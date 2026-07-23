import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { exchangeBlingCode } from '@/lib/admin.functions';

export const Route = createFileRoute('/_authenticated/admin/bling/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) || '',
    state: (search.state as string) || '',
  }),
  component: BlingCallback,
});

function BlingCallback() {
  const { code, state } = Route.useSearch();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const exchangeFn = useServerFn(exchangeBlingCode);

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMsg('Código de autorização não encontrado na URL.');
      return;
    }

    exchangeFn({ data: { code, state } })
      .then(() => setStatus('ok'))
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err?.message || 'Erro ao autorizar Bling.');
      });
  }, [code, state, exchangeFn]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Autorizando Bling…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Erro</p>
        <h1 className="font-serif text-3xl">Falha na autorização</h1>
        <p className="text-sm text-muted-foreground max-w-md">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Sucesso</p>
      <h1 className="font-serif text-3xl">Bling conectado</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        A integração com o Bling foi autorizada. Você pode fechar esta janela.
      </p>
    </div>
  );
}
