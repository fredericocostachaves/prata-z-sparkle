-- Restringir acesso público à tabela produtos (segurança).
-- A policy pública anterior ("Public can view active in-stock products")
-- concedia SELECT em TODAS as colunas para anon/authenticated, expondo
-- preco_custo, estoque_atual, estoque_minimo e fornecedor_id.
-- A partir daqui o acesso público é somente via a view restrita
-- vw_catalogo_produtos; o catálogo do app passa a ler a tabela com
-- service_role (apenas no servidor), que já possui GRANT ALL.

-- 1. Revoga o SELECT direto da tabela para a role anon (publishable key)
REVOKE SELECT ON public.produtos FROM anon;

-- 2. Remove as policies públicas de leitura na tabela.
--    Admin/staff seguem lendo via a policy "prod write admin staff"
--    (FOR ALL TO authenticated USING has_role), que cobre SELECT.
DROP POLICY IF EXISTS "Public can view active in-stock products" ON public.produtos;
DROP POLICY IF EXISTS "prod read public" ON public.produtos;

-- 3. View pública restrita com as colunas seguras para a vitrine.
--    NÃO expõe: preco_custo, estoque_atual, estoque_minimo, fornecedor_id,
--    created_at, updated_at. Já filtra produtos ativos e com estoque.
DROP VIEW IF EXISTS public.vw_catalogo_produtos;
CREATE VIEW public.vw_catalogo_produtos
WITH (security_barrier = true) AS
SELECT
  id,
  sku,
  nome,
  descricao,
  preco_venda,
  imagem_url,
  galeria_urls,
  categoria,
  peso_g,
  altura_cm,
  largura_cm,
  comprimento_cm
FROM public.produtos
WHERE ativo = true AND estoque_atual >= 1;

-- 4. Acesso de leitura público somente via a view restrita
GRANT SELECT ON public.vw_catalogo_produtos TO anon, authenticated;
