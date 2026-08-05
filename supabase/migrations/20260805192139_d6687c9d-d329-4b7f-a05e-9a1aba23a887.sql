-- 1) View: enforce querying user's permissions instead of the view owner's
ALTER VIEW public.vw_catalogo_produtos SET (security_invoker = true);

-- 2) Restrict view privileges to read-only
REVOKE ALL ON public.vw_catalogo_produtos FROM anon, authenticated;
GRANT SELECT ON public.vw_catalogo_produtos TO anon, authenticated;
GRANT ALL ON public.vw_catalogo_produtos TO service_role;

-- 3) With security_invoker the public catalog needs a narrow anon read path on produtos.
--    Column-level grants keep cost/stock/supplier hidden; RLS limits rows to active + in stock.
REVOKE ALL ON public.produtos FROM anon;
GRANT SELECT (id, sku, nome, descricao, preco_venda, imagem_url, galeria_urls, categoria, peso_g, altura_cm, largura_cm, comprimento_cm)
  ON public.produtos TO anon;

DROP POLICY IF EXISTS "prod read public catalog" ON public.produtos;
CREATE POLICY "prod read public catalog"
  ON public.produtos
  FOR SELECT
  TO anon
  USING (ativo = true AND estoque_atual >= 1);

-- 4) SECURITY DEFINER functions: remove execute from unauthenticated/public roles
REVOKE ALL ON FUNCTION public.promote_user(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_user(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.baixa_estoque_pedido_pago() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 5) Customer self-service read on their own linked record
DROP POLICY IF EXISTS "cli read own" ON public.clientes;
CREATE POLICY "cli read own"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());