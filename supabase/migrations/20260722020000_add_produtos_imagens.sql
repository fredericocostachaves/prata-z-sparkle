-- Add image columns to produtos table
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS imagem_url text,
ADD COLUMN IF NOT EXISTS galeria_urls text[] default '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.produtos.imagem_url IS 'URL da imagem de capa do produto';
COMMENT ON COLUMN public.produtos.galeria_urls IS 'Array com URLs das imagens da galeria do produto';
