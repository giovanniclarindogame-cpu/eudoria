# Cavaleiro do Firmamento — arte v37

Herói 8, original e sem arma. Armadura azul-claro e prata com filetes dourados, constelação no peitoral, diadema com asas curtas e cachecol vermelho. O rosto foi redesenhado após a comparação com o Corsário: cabelo castanho curto e ondulado, franja baixa, olhos azul-acinzentados, pequenas sardas e expressão serena. A mesma identidade aparece no retrato, referência, 72 poses e cinco ícones. O corpo compacto segue o Ninja das Brumas e o Corsário, sem musculatura exagerada.

Todos os 19 arquivos são WebP sem perdas; dimensões, transparência e SHA-256 estão em `manifest.json`.

| Arquivos | Dimensões | Conteúdo |
| --- | --- | --- |
| portrait.webp | 760 × 1140 | Corpo inteiro, transparente |
| reference.webp | 1536 × 1024 | Frente, lado e costas |
| body.webp | 1254 × 1254 | 36 células de 209 × 209 |
| skills.webp | 1254 × 1254 | 36 células de 209 × 209 |
| icon-0.webp a icon-4.webp | 256 × 256 cada | Quadrados preenchidos; a interface faz o recorte circular |
| background.webp | 1536 × 1024 | Santuário estrelado, opaco |
| punch, comet, kick, dash, meteor, final, constellation, exposed, stage.webp | 1536 × 1024 cada | 24 células de 256 × 256, transparentes |

Leitura da esquerda para a direita. Corpo: repouso, corrida lateral, corrida de frente, corrida de costas, soco básico, reações (dano, dano, queda, caído, defesa, avanço). Pés na linha 193, âncora horizontal 104,5, margem mínima de 8 px e repouso com até 173 px.

Habilidades: Rajada Estelar, Cometa Veloz, Chute Crescente, Investida Galopante, Constelação Radiante e vitória. Cada linha tem seis poses. O Cometa distribui o preparo pelos três primeiros desenhos durante os 0,3 s definidos pela jogabilidade; a execução só começa no disparo real. A Rajada alterna os punhos; o Chute usa as poses de perna e mantém seu arco ascendente nos dois sentidos. A ultimate ergue o braço para chamar os meteoros.

Efeitos: formação 0–7, intensidade 8–15 e dissipação 16–23, margem transparente mínima de 16 px. A folha `stage` usa as três faixas como estados: apagada, acesa azul e brilhante dourada. As posições das três estrelas, carga do Cometa, Exposto e constelação acompanham os dados e durações originais. Os meteoros mostram os quadros 0–7 antes das tarefas reais de impacto e 8–23 a partir dos impactos. O centro luminoso de cada quadro de impacto usa a âncora registrada no manifesto para coincidir com o ponto real do acerto. A ultimate mantém 7 ou 9 meteoros e um final; a camada visual não cria nem altera tarefas de dano.

`js/cavaleiro_arte_v37.js` carrega depois de `js/cavaleiro_v3.js`. Integra retrato, seleção, HUD, ícones, corpo, habilidades, efeitos e K.O. O recorte explícito do rosto é x=180, y=40, 440 × 440 na imagem de 760 × 1140, com saída de 96 × 96. O botão de avanço usa icon-3 e a ultimate icon-4. `css/cavaleiro_arte_v37.css` aplica o santuário à página do personagem.

`js/cavaleiro_v3.js` foi preservado byte a byte (hash no manifesto); nenhum dano, custo ou recarga foi alterado. A folha de efeito substitui o desenho dos marcadores, enquanto seus valores continuam sendo lidos da jogabilidade.

Validação, com servidor HTTP na porta 8000 e `index.html?allheroes=1`:

- `node tests/cavaleiro-arte-v37.cjs`: dimensões, formato sem perdas, 288 quadros distintos, pés, margens, transparência, eventos reais nos dois sentidos, preparo do Cometa, impactos e quedas dos meteoros, estrelas de estágio, Exposto, K.O., proporções e seleção/botões em 1280 × 720 e 844 × 390.
- `node tests/cavaleiro-v3.cjs`: custos, recargas, estágios, bônus, Exposto e 7/9 meteoros mais o final. Os resultados antes/depois da integração foram idênticos.

O primeiro teste aceita `--assets-only` ou `--game-only`; usa Chromium em `/usr/bin/chromium` ou `CHROMIUM_PATH`. O teste existente de jogabilidade usa o Chromium configurado no Playwright.

`scripts/pack-cavaleiro-v37.cjs` realiza somente preparação técnica: separação das células, recorte, alinhamento, escala proporcional e exportação. Uso: `node scripts/pack-cavaleiro-v37.cjs nome origem.png [linhasDaOrigem]`. Para fontes com desenhos extras, seleciona 24 quadros reais mantendo a ordem temporal. O recorte do chute usa a fonte de cinco linhas; a entrega continua sendo 6 × 4.
