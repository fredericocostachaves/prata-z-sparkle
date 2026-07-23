import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/bling/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state') || '';

          if (!code) {
            return new Response('Missing authorization code', { status: 400 });
          }

          return new Response(null, {
            status: 302,
            headers: {
              Location: `/admin/configuracoes?bling_code=${encodeURIComponent(code)}&bling_state=${encodeURIComponent(state)}`,
            },
          });
        } catch (error) {
          console.error('[Bling Callback] Error:', error);
          return new Response('Authorization failed', { status: 500 });
        }
      },
    },
  },
});
