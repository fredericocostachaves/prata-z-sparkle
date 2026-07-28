-- Seed products for the produtos table
-- This inserts sample products across all categories for development/testing

INSERT INTO public.produtos (sku, nome, descricao, preco_venda, estoque_atual, ativo, categoria, imagem_url)
VALUES
  ('CLR-001', 'Colar Coração Eterno', 'Pingente coração com acabamento polido em prata 925.', 189.00, 10, true, 'colares', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'),
  ('CLR-002', 'Choker Veneziana', 'Corrente veneziana fina, perfeita para sobreposição.', 169.00, 15, true, 'colares', 'https://images.unsplash.com/photo-1603975217915-1ba7ce4f8e10?w=600&q=80'),
  ('CLR-003', 'Gargantilha Estrela', 'Estrela cravejada em zircônias, brilho discreto.', 199.00, 8, true, 'colares', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'),
  ('BRC-001', 'Argola Lisa Polida', 'Clássica argola lisa, leve e versátil.', 149.00, 20, true, 'brincos', 'https://images.unsplash.com/photo-1635767798638-3665c74c77b2?w=600&q=80'),
  ('BRC-002', 'Ear Cuff Folha', 'Ear cuff com design floral, sem necessidade de furo.', 129.00, 12, true, 'brincos', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'),
  ('BRC-003', 'Brinco Gota Cravejado', 'Gota com microcravação, brilho elegante.', 219.00, 5, true, 'brincos', 'https://images.unsplash.com/photo-1589128777073-2636ae46e5a9?w=600&q=80'),
  ('ANE-001', 'Trio de Anéis Delicados', 'Conjunto com três anéis finos e combináveis.', 229.00, 7, true, 'aneis', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'),
  ('ANE-002', 'Solitário Zircônia', 'Solitário clássico com zircônia central.', 259.00, 6, true, 'aneis', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'),
  ('ANE-003', 'Aliança Polida 4mm', 'Aliança em prata 925 com acabamento polido.', 299.00, 4, true, 'aneis', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'),
  ('PLS-001', 'Pulseira Riviera Cravejada', 'Riviera cravejada em zircônias brancas.', 319.00, 3, true, 'pulseiras', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('PLS-002', 'Pulseira Elos Cubanos', 'Elos cubanos em prata 925 com fechamento seguro.', 249.00, 9, true, 'pulseiras', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('PLS-003', 'Bracelete Liso', 'Bracelete polido, leve e atemporal.', 279.00, 6, true, 'pulseiras', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('PNG-001', 'Pingente Letra Personalizada', 'Escolha sua letra e personalize sua corrente.', 99.00, 25, true, 'pingentes', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'),
  ('PNG-002', 'Pingente Infinito', 'Símbolo do infinito com acabamento polido.', 119.00, 18, true, 'pingentes', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'),
  ('PNG-003', 'Pingente Mandala', 'Mandala com detalhes vazados em prata 925.', 139.00, 14, true, 'pingentes', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'),
  ('BRQ-001', 'Berloque Coração', 'Charm em formato de coração para personalizar pulseiras.', 89.00, 30, true, 'berloques', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('BRQ-002', 'Berloque Estrela do Mar', 'Charm marinho com acabamento detalhado.', 95.00, 22, true, 'berloques', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('BRQ-003', 'Berloque Inicial', 'Charm com letras para personalizar.', 89.00, 28, true, 'berloques', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('PRC-001', 'Piercing Argola Tragus', 'Argola fina hipoalergênica em prata 925.', 79.00, 15, true, 'piercings', 'https://images.unsplash.com/photo-1635767798638-3665c74c77b2?w=600&q=80'),
  ('PRC-002', 'Piercing Helix Estrela', 'Piercing helix com estrela cravejada.', 89.00, 12, true, 'piercings', 'https://images.unsplash.com/photo-1635767798638-3665c74c77b2?w=600&q=80'),
  ('TRN-001', 'Tornozeleira Veneziana', 'Corrente veneziana delicada com fecho seguro.', 159.00, 10, true, 'tornozeleiras', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('TRN-002', 'Tornozeleira Coração', 'Pingente coração em corrente fina.', 179.00, 8, true, 'tornozeleiras', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'),
  ('CUD-001', 'Flanela Antiembaçante', 'Flanela especial para limpeza e brilho da prata.', 29.00, 50, true, 'cuidados', NULL),
  ('CUD-002', 'Líquido Restaurador de Brilho', 'Líquido específico para joias em prata 925.', 49.00, 40, true, 'cuidados', NULL)
ON CONFLICT (sku) DO NOTHING;
