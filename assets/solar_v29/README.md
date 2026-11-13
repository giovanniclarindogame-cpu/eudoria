# Guardião Solar · arte v29

Revisão criada sobre `e6d54e8`, preservando o motor, balanceamento e menus atuais do GitHub. Visual original: cabelo laranja-dourado em chamas curtas, capa branca com bordas douradas e motivos solares laranja, armadura leve dourada e espada com canal de brasa. Referências de tratamento: Astral/Ninja em `corpos_v24` e Ronin em `ichigo_v27` (revisão v28).

Todos os **16 arquivos WebP usam compressão sem perdas**. Corpo, retrato, ícones e efeitos têm canal alfa; `background.webp` é uma cena completa opaca, destinada ao fundo da seleção.

| Arquivo | Dimensão | Organização |
| --- | --- | --- |
| `body.webp` | 1254 × 1254 | 6 × 6, 36 células de 209 × 209 |
| `portrait.webp` | 760 × 1140 | Corpo inteiro; proporção exata 2:3 |
| `background.webp` | 1536 × 1024 | Pátio de um templo solar ao amanhecer |
| `icon-0.webp` … `icon-5.webp` | 256 × 256 cada | Mesmo personagem executando cada golpe |
| `slash.webp`, `tiger.webp`, `pillar.webp`, `dash.webp`, `phoenix.webp`, `impact.webp` | 1536 × 1024 cada | 6 × 4, 24 células de 256 × 256 |
| `aura.webp` | 1536 × 1024 | Atlas adicional de 24 quadros para a respiração/buff |

## Corpo

Linhas: repouso, corrida lateral, corrida frontal, corrida de costas, ataques. Última linha, da esquerda para a direita: reação, recuperação, queda, caído, defesa, avanço.

Os quadros mantêm o eixo horizontal no centro da célula (104,5) e os pés/ponto de apoio na linha **193**. Uma escala uniforme preserva as proporções entre as poses. O jogo normaliza a altura em repouso para 73 unidades, como Astral, Ninja e Ronin. A respiração é discreta e tem os pés como ponto fixo; a arma e a capa não deslocam o eixo do corpo.

## Ordem dos ícones e efeitos

Os nomes atuais do jogo foram renovados antes desta revisão. A ordem e a função pedidas são mantidas, sem desfazer essa atualização de textos:

| Ícone | Nome usado na solicitação | Nome atual no jogo | Efeito |
| --- | --- | --- | --- |
| 0 | Corte Flamejante | Lâmina Ígnea | `slash.webp` |
| 1 | Tigre de Fogo | Fera de Brasa | `tiger.webp` |
| 2 | Pilar Ardente | Coluna Solar | `pillar.webp` |
| 3 | Investida Solar | Passo do Amanhecer | `dash.webp` |
| 4 | Respiração Ardente | Chama Interior | `aura.webp` |
| 5 | Fênix Ardente | Fênix do Amanhecer | `phoenix.webp` |

`impact.webp` mostra contato, expansão do fogo e fumaça. Não contém placa de chão. O buff usa uma aura própria com centro aberto para manter o personagem legível.

## Reprodução dos efeitos

Leitura da esquerda para a direita, depois próxima linha. Índices 0–7: formação; 8–15: intensidade máxima; 16–23: dissipação. Cada célula inclui uma margem transparente de 16 pixels. As imagens são **folhas de sprites**, não arquivos WebP que animam sozinhos.

- O corte começa no instante da liberação da espada.
- O tigre forma-se, sustenta o voo e dissipa no fim do alcance; o contato gera o impacto separado.
- O pilar usa a primeira fase no aviso de 0,5 s. As fases de erupção e dissipação começam quando o motor aplica o dano.
- Dash e fênix seguem a posição real do lutador. Rastros permanecem nos pontos percorridos; a dissipação fica no ponto final, inclusive quando o avanço encontra uma parede.
- A aura sustenta os quadros centrais enquanto o buff está ativo.
- Os efeitos direcionais usam espelhamento horizontal ao viajar para a esquerda, sem inverter a imagem de cabeça para baixo.

## Editar e verificar

Preserve os nomes, dimensões, ordem das células, eixo do corpo e transparência. `scripts/import-solar-v29.cjs` empacota as fontes PNG, alinha os pés e cria as margens dos efeitos. Para usá-lo, forneça uma pasta com `body.png`, `portrait.png`, `background.png`, `icons.png` (3 × 2 ícones de 512 pixels) e um PNG com o nome de cada efeito.

Com `python3 -m http.server 8000` na raiz do jogo, execute `node tests/solar-v29.cjs`. O teste verifica formato sem perdas, dimensões, transparência, todas as células, animações no motor de seis habilidades e no combate v3, queimaduras, aviso do pilar, colisões do dash, fênix, morte, orientação, escala, seleção e toque em tela horizontal.
