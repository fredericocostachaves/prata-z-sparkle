import { createFileRoute } from '@tanstack/react-router';
import { bling } from '@/lib/integrations/bling.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const Route = createFileRoute('/api/bling/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get('code');

          if (!code) {
            return new Response('Missing authorization code', { status: 400 });
          }

          // Exchange code for tokens
          const tokenData = await bling.exchangeCode(code);

          // Store in Supabase (we need to know which user - use service_role to find latest admin)
          const { data: admins } = await (supabaseAdmin as any)
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
            .limit(1);

          if (admins && admins.length > 0) {
            const userId = admins[0].user_id;
            const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

            await (supabaseAdmin as any).from('bling_tokens').upsert(
              {
                user_id: userId,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: expiresAt,
              },
              { onConflict: 'user_id' }
            );
          }

          // Redirect back to admin page
          return new Response(null, {
            status: 302,
            headers: {
              Location: '/admin?bling=connected',
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
