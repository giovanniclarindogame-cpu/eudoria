# Ronin Carmesim — arte e habilidades

Arte original inspirada no arquétipo do espadachim espiritual, adaptada ao elenco de Eldoria. Referências de estilo: retratos do Guerreiro Astral e Ninja das Brumas e os quatro campeões de `champions_v7/07–10`. O personagem usa cabelo cobre, traje azul-escuro/carmesim, ombreira de bronze e espada com incrustação vermelha.

- `portrait.webp`: retrato transparente para seleção, biblioteca e HUD.
- `background.webp`: pátio espiritual noturno para a seleção.
- `body.webp`: atlas transparente de 6 × 6 poses. Linhas: repouso, corrida lateral, corrida frontal, corrida de costas, ataques; última linha: reação, recuperação, queda, caído, defesa, avanço.
- `icon-0.webp` a `icon-5.webp`: seis ilustrações no estilo dos ícones Astral/Ninja, na ordem das habilidades.

## Revisão de arte v28

Atualizada sobre `aad2083` (última versão do Claude consultada). Mantém os kits, custos, colisões, balanceamento e controles do combate v3.

- `body.webp`: **1254 × 1254**, 36 células de **209 × 209**, WebP sem perdas com transparência. Estilo e proporções referenciados em `corpos_v24/astral-base.webp` e `ninja-base.webp`. O corpo mantém cabelo cobre, roupa azul-escuro/carmesim, ombreira de bronze e espada com incrustação vermelha.
- `slash.webp`: arco de espada, usado no Corte Rápido e no corte pesado.
- `getsuga.webp`: onda espiritual preta e vermelha.
- `shunpo.webp`: faixas azuis de velocidade. As imagens residuais são desenhadas a partir do próprio atlas do personagem.
- `bankai.webp`: nascimento, pulsação e dissipação da aura de transformação.
- `getsuga-final.webp`: feixe negro/carmesim com frente em meia-lua.
- `impact.webp`: contato, explosão de energia e fumaça, sem placa de chão.
- `icon-0.webp` a `icon-5.webp`: **256 × 256**, cada um mostra o mesmo Ronin executando a habilidade correspondente.

Cada atlas de efeitos mede **1536 × 1024**, com **24 quadros de 256 × 256**, 6 colunas × 4 linhas, lidos da esquerda para a direita. São folhas de sprites transparentes: o jogo seleciona os quadros, em vez de depender da reprodução automática de um WebP animado. Os quadros 0–7 representam formação; 8–15, maior intensidade; 16–23, dissipação. Os cortes e impactos percorrem a sequência inteira na duração da ação. Projéteis entram, sustentam o voo e dissipam; a aura sustenta os quadros centrais enquanto o Bankai está ativo.

O desenho é registrado pelos limites de alfa e normalizado para 73 pixels de altura em repouso, com os pés na mesma linha do elenco. A respiração gira em torno dos pés; o eixo horizontal usa o centro fixo da célula para a espada não deslocar o corpo. A variante de Bankai é armazenada em canvas para evitar filtros em cada quadro. O espelhamento horizontal usa o mesmo orientador dos outros campeões, sem inverter a arte de cabeça para baixo.

Para editar: preserve a dimensão do atlas, a ordem das células e o fundo transparente. Mantenha o corpo centrado, os pés alinhados e cada efeito dentro de sua própria célula. Os efeitos têm suavização apenas na borda transparente de cada célula durante a renderização, como os efeitos do Astral.

Os registros de tamanho do Ronin, Astral e Ninja aguardam o carregamento completo do WebP antes de armazenar os limites de alfa. Isso evita guardar uma medição parcial na primeira abertura do lobby.

Validação: com `python3 -m http.server 8000`, execute `node tests/ichigo-v27.cjs` (motor de seis habilidades em `?legacy=1`) e `node tests/ichigo-arte-v28.cjs` (artes, orientação, escala, efeitos e controles atuais em desktop/celular).
