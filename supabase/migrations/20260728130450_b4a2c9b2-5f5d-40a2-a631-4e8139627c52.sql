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
WHERE categoria IS NULL;

CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos (categoria);

GRANT SELECT ON public.produtos TO anon;

DROP POLICY IF EXISTS "Public can view active in-stock products" ON public.produtos;
CREATE POLICY "Public can view active in-stock products"
ON public.produtos FOR SELECT
TO anon, authenticated
USING (ativo = true AND estoque_atual >= 1);