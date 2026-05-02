## Plano: Páginas internas e funcionalidades do e-commerce Prata Z Joias

Vou criar a arquitetura completa de páginas internas, mantendo o estilo visual já definido (rosa nude, vermelho CTA, tipografia Playfair + Inter, fundo branco) e a navegação atual.

### 1. Rotas a criar (TanStack file-based routing)

**Catálogo / Produto**
- `src/routes/categoria.$slug.tsx` — Página de categoria/listagem (Colares, Brincos, Anéis, Pulseiras, Pingentes, Berloques, Piercings, Tornozeleiras, Cuidados). Suporta as 9 categorias do menu via param dinâmico.
- `src/routes/produto.$slug.tsx` — Página de detalhe do produto (galeria, descrição, preço, parcelamento 4x, seleção de tamanho, botão "Adicionar à sacola", "Comprar pelo WhatsApp").
- `src/routes/busca.tsx` — Resultado de busca (lê `?q=` via search params).

**Conteúdo institucional**
- `src/routes/blog.tsx` — Listagem de posts do blog.
- `src/routes/blog.$slug.tsx` — Post individual.
- `src/routes/sobre.tsx` — Sobre a Prata Z (história, propósito).
- `src/routes/autenticidade.tsx` — Garantia de prata 925, certificado, cuidados.
- `src/routes/showroom.tsx` — Agendamento de visita (formulário + link Google Agenda).
- `src/routes/grupo-vip.tsx` — Página dedicada ao grupo VIP do WhatsApp.
- `src/routes/contato.tsx` — Formulário de contato + canais (WhatsApp, e-mail, Instagram).
- `src/routes/politica-troca.tsx` — Trocas e devoluções.
- `src/routes/politica-privacidade.tsx` — Privacidade.
- `src/routes/termos.tsx` — Termos de uso.
- `src/routes/entrega.tsx` — Política de entrega e frete.

**Conta / Compra**
- `src/routes/sacola.tsx` — Carrinho de compras (lista, quantidade, total, finalizar).
- `src/routes/favoritos.tsx` — Lista de favoritos.
- `src/routes/checkout.tsx` — Checkout simplificado (dados, endereço, pagamento — visual; integração real fica como placeholder Bling).
- `src/routes/conta.tsx` — Layout da área do cliente (com `<Outlet />`).
- `src/routes/conta.pedidos.tsx` — Pedidos.
- `src/routes/conta.dados.tsx` — Meus dados.
- `src/routes/conta.enderecos.tsx` — Endereços.
- `src/routes/login.tsx` — Login / cadastro (visual; sem backend nesta etapa).

### 2. Funcionalidades client-side

- **Carrinho (sacola)**: Context + `localStorage` (`CartContext`) com `addItem`, `removeItem`, `updateQty`, `clear`, contador no header, drawer lateral opcional ou página dedicada `/sacola`.
- **Favoritos**: Context + `localStorage` (`FavoritesContext`) com toggle no card e contagem.
- **Busca**: input no header navega para `/busca?q=...`, página filtra catálogo mock.
- **Catálogo mock**: `src/data/products.ts` com ~24 produtos distribuídos entre as 9 categorias (id, slug, nome, categoria, preço, imagens, descrição, tamanhos disponíveis). Reaproveita as imagens já existentes em `src/assets`.
- **Card de produto reutilizável**: `src/components/ProductCard.tsx` com favorito, badge de novidade, hover suave.
- **Filtros simples** na página de categoria: ordenação (mais vendidos / menor preço / maior preço / lançamentos) e faixa de preço.
- **Toast de feedback** (já temos sonner): "Adicionado à sacola", "Salvo nos favoritos".

### 3. Atualizações em componentes existentes

- `Header.tsx`: itens do menu viram `<Link to="/categoria/$slug">`, ícone de busca abre input que envia para `/busca`, ícones de favoritos e sacola viram links com badge de contagem real do contexto.
- `Footer.tsx`: links institucionais apontam para as novas rotas reais.
- `__root.tsx`: envolver `<Outlet />` com `CartProvider` e `FavoritesProvider`; adicionar `notFoundComponent` (404 com link para home).
- `router.tsx`: adicionar `defaultErrorComponent` (já tem) e garantir `scrollRestoration`.
- Componentes de seção da home (`HeroBanner`, `MostLoved`, `Showroom`, `VipGroup`) recebem links reais para as novas rotas.

### 4. SEO por rota

Cada rota define seu próprio `head()` com `title`, `description`, `og:title`, `og:description` específicos — palavras-chave foco: "Alta joalheria em prata 925", "Atendimento personalizado de joias", além do nome da categoria/produto.

### 5. Preparação para integrações futuras (sem implementar agora)

- **Bling**: Centralizar acesso a produtos em `src/data/products.ts` exportando funções `getProducts()`, `getProductBySlug()`, `getProductsByCategory()` — assim, trocar para chamadas server-fn ao Bling depois é localizado.
- **Bot Conversa**: Reservar slot no `__root.tsx` (comentário + div com id) para o widget de IA.
- **WhatsApp**: já temos `FloatingButtons`; manter.

### 6. Observações técnicas

- Tudo client-side por enquanto; sem Lovable Cloud nesta etapa (o usuário não pediu autenticação real / banco). Quando precisar persistir pedidos e contas reais, ativamos Cloud.
- Uso apenas tokens do design system definidos em `src/styles.css`. Sem cores hardcoded.
- Cada rota nova respeita os padrões TanStack: `createFileRoute`, `head()`, `errorComponent` quando há loader.
- Imagens reutilizadas para não inflar o bundle; produtos mock usam variações das fotos existentes.

### Resultado esperado

Site navegável de ponta a ponta: usuário consegue navegar pelas categorias, abrir produtos, adicionar à sacola, favoritar, buscar, ler blog, agendar showroom, entrar no VIP e percorrer todas as páginas institucionais — tudo com SEO, design consistente e arquitetura preparada para Bling e Bot Conversa.
