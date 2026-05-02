## Substituir e ampliar o logo

**Arquivos afetados:** `src/assets/` (novo arquivo), `src/components/Header.tsx`, `src/components/Footer.tsx` (se usar o mesmo logo)

### Passos

1. **Copiar o novo logo enviado** (`user-uploads://Design_sem_nome.png`) para `src/assets/prata-z-logo.png`, substituindo a referência ao antigo `prata-z-logo.jpeg`.

2. **Ampliar o logo no `Header.tsx`:**
   - Trocar import para o novo PNG.
   - Aumentar altura de `h-14 md:h-16` para algo como `h-20 md:h-24` (≈ +50%).
   - Como o arquivo tem bastante espaço em branco ao redor do símbolo, aplicar `object-contain` mantendo, e ajustar padding vertical do header se necessário para não inflar demais a barra.

3. **Footer:** se o footer também referencia o logo antigo, atualizar import e dar tamanho proporcionalmente maior (ex.: `h-16`).

4. **Verificação visual** no preview (desktop 948px e mobile) para confirmar que o logo aparece nítido, centralizado no mobile e alinhado à esquerda no desktop, sem quebrar a navegação.

### Observação
O PNG enviado tem muito espaço em branco em volta do símbolo — isso faz o logo parecer menor mesmo com altura alta. Posso (opcional) recortar o PNG removendo as margens brancas antes de usar, o que dá mais presença visual sem precisar aumentar tanto o `h-`. Se preferir, faço esse recorte automaticamente na implementação.