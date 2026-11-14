# Caçador Espectral — pacote de arte v32

Campeão 6 (índice 5 no código). Identidade original: jovem de cabelo verde-azulado, colete oliva, bermuda azul-escura, luvas com bandagens, botas de trilha e vara de pesca com linha e anzol. O retrato aprovado guia corpo, forma adulta e ícones. Contornos escuros, cores saturadas e anatomia compacta no padrão do elenco.

Todos os **17 arquivos são WebP sem perdas**. Personagens e efeitos têm alfa transparente; o cenário é opaco.

| Arquivo | Conteúdo |
|---|---|
| `portrait.webp` | 760 × 1140; corpo inteiro ajoelhado, vara no ombro, punho à frente e sorriso. |
| `body.webp` | 1254 × 1254; 6 × 6 células de 209 px. Repouso, corrida lateral, frontal, costas, ataques; última linha: reação, recuperação, queda, caído, defesa, avanço. |
| `adult.webp` | 1254 × 836; 6 × 4 células de 209 px. Repouso, preparo, soco e retorno. Cabelo longo, corpo adulto musculoso, colete rasgado e mesma vara. |
| `icon-0.webp` | 256 × 256; Soco Carregado. |
| `icon-1.webp` | 256 × 256; Pedra Rápida. |
| `icon-2.webp` | 256 × 256; Vara Giratória. |
| `icon-3.webp` | 256 × 256; Salto Selvagem, também usado no botão de dash. |
| `icon-4.webp` | 256 × 256; Instinto Animal. |
| `icon-5.webp` | 256 × 256; Juramento Total, com a forma adulta. |
| `background.webp` | 1536 × 1024; floresta com cachoeira ao entardecer, verde e dourado. |
| `punch.webp` | Onda curta e faíscas do soco rápido. |
| `charge.webp` | Energia convergindo ao punho, do amarelo ao laranja e vermelho. |
| `heavy.webp` | Anel de fogo e explosão no contato do soco carregado. |
| `rod.webp` | Vara em rotação com linha, vento e poeira. |
| `jump.webp` | Decolagem (0–7), sombra durante o salto (8–15), pouso (16–23). |
| `oath.webp` | Formação, intensidade e dissipação da aura dourada da transformação. |
| `impact.webp` | Contato e explosão suspensos no ar, sem placa de chão. |

Cada efeito tem **1536 × 1024**, com **24 quadros de 256 × 256**, 6 colunas × 4 linhas. Leitura da esquerda para a direita. Quadros 0–7: formação; 8–15: intensidade; 16–23: dissipação. Margens transparentes de pelo menos 16 px em cada célula, sem fundo branco ou placa quadrada.

Corpo: altura máxima de repouso **173 px**, apoio na linha **y = 193**, eixo horizontal **104,5**. Na arena, a forma jovem mede aproximadamente **73 px** como os outros campeões; a adulta cresce até **103 px** mantendo o apoio no chão. São 36 poses jovens, 24 adultas e 168 quadros de efeitos distintos.

Revisão v34: as 36 poses jovens foram redesenhadas usando `assets/corpos_v24/astral-base.webp` como referência de proporções. Tronco, braços e pernas mais robustos, cabeça menor em relação ao corpo; identidade, ordem das poses, tamanho de célula e apoio no chão preservados. A forma adulta permanece no atlas próprio. O corpo revisado usa `?v=34` para atualizar o cache.

Integração: `js/hunter_v32.js` conecta as artes aos eventos existentes; `css/hunter_v32.css` aplica o cenário. Mantém dano, recargas, cancelamento de carga por dano, custo de vida da ultimate e controles atuais. A forma adulta acompanha o preparo, golpe e recuperação do Juramento Total; o golpe pesado explode somente no contato. As artes detalhadas são desenhadas na resolução do canvas.

Empacotamento técnico dos PNGs gerados: `node scripts/pack-hunter-v32.cjs /pasta/dos/pngs`. O retrato aprovado é preservado separadamente.

Validação: `node tests/hunter-v32.cjs`. Com o servidor em `http://127.0.0.1:8000`, execute `node tests/hunter-v32-integration.cjs` (modo legado e atual, carga, cancelamento, dano, salto, transformação, escala do elenco, seleção em desktop/celular e ícone do dash).
