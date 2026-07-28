-- Fix: garantir que a role anon (publishable key) consiga consultar produtos
-- A publishable key se comporta como a role anon no Supabase

-- 1. Garantir permissão de SELECT para anon (publishable key)
GRANT SELECT ON public.produtos TO anon;

-- 2. Remover policies antigas que só permitem acesso a authenticated
DROP POLICY IF EXISTS "prod read staff" ON public.produtos;
DROP POLICY IF EXISTS "prod write admin" ON public.produtos;
DROP POLICY IF EXISTS "Public can view active in-stock products" ON public.produtos;

-- 3. Recriar policy de leitura pública (para anon e authenticated)
CREATE POLICY "prod read public"
ON public.produtos FOR SELECT
TO anon, authenticated
USING (ativo = true AND estoque_atual >= 1);

-- 4. Policy de escrita apenas para admin/staff autenticados
CREATE POLICY "prod write admin staff"
ON public.produtos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- 5. Garantir que a coluna categoria existe e está populada
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria text;

UPDATE public.produtos SET categoria = CASE
  WHEN nome ILIKE '%colar%' OR nome ILIKE '%gargantilha%' OR nome ILIKE '%choker%' OR nome ILIKE '%corrente%' THEN 'colares'
  WHEN nome ILIKE '%brinco%' OR nome ILIKE '%argola%' OR nome ILIKE '%ear cuff%' THEN 'brincos'
  WHEN nome ILIKE '%anel%' OR nome ILIKE '%aneis%' OR nome ILIKE '%anéis%' OR nome ILIKE '%alian%' OR nome ILIKE '%falange%' THEN 'aneis'
  WHEN nome ILIKE '%pulseira%' OR nome ILIKE '%bracelete%' OR nome ILIKE '%riviera%' THEN 'pulseiras'
  WHEN nome ILIKE '%pingente%' THEN 'pingentes'
  WHEN nome ILIKE '%berloque%' OR nome ILIKE '%charm%' THEN 'berloques'
  WHEN nome ILIKE '%piercing%' OR nome ILIKE '%pierc%' THEN 'piercings'
  WHEN nome ILIKE '%tornozeleira%' THEN 'tornozeleiras'
  WHEN nome ILIKE '%flanela%' OR nome ILIKE '%limpeza%' OR nome ILIKE '%cuidado%' OR nome ILIKE '%polimento%' THEN 'cuidados'
  ELSE categoria
END
WHERE categoria IS NULL OR categoria = '';
