# Ronin Carmesim — arte e habilidades

Arte original inspirada no arquétipo do espadachim espiritual, adaptada ao elenco de Eldoria. Referências de estilo: retratos do Guerreiro Astral e Ninja das Brumas e os quatro campeões de `champions_v7/07–10`. O personagem usa cabelo cobre, traje azul-escuro/carmesim, ombreira de bronze e espada com incrustação vermelha.

- `portrait.webp`: retrato transparente para seleção, biblioteca e HUD.
- `background.webp`: pátio espiritual noturno para a seleção.
- `body.webp`: atlas transparente de 6 × 6 poses. Linhas: repouso, corrida lateral, corrida frontal, corrida de costas, ataques; última linha: reação, recuperação, queda, caído, defesa, avanço.
- `icon-0.webp` a `icon-5.webp`: seis ilustrações no estilo dos ícones Astral/Ninja, na ordem das habilidades.

O desenho é registrado pelos limites de alfa e normalizado para 73 pixels de altura em repouso, com os pés na mesma linha do elenco. A variante de Bankai é armazenada em canvas para evitar filtros em cada quadro.

Validação: com `python3 -m http.server 8000`, execute `node tests/ichigo-v27.cjs`. O teste cobre habilidades, custos, recargas, colisões, interrupção da carga, controles, seleção e comparação de escala.
