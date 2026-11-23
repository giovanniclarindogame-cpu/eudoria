# Efeitos v39 — ícones e efeitos dos pacotes de jogabilidade v3

Gerados com a IA de imagem do Canva e recortados/alinhados por script (fundo branco removido nos ícones; efeitos mantidos sobre preto e desenhados somando luz). WebP sem perdas, células de 256 × 256.

| Arquivo | Grade | Conteúdo (ordem de leitura) |
| --- | --- | --- |
| icons.webp | 3 × 3, transparente | katana na bainha · adagas · olho · anzol · gema verde · gema dourada · marca de presa · fratura · brasa |
| fx_a.webp | 3 × 3, fundo preto | aura de ki · explosão dourada · anel dourado · fumaça · corte vermelho · explosão de fogo · impacto violeta · explosão rubro-violeta · runas violeta |
| fx_b.webp | 2 × 2, fundo preto | explosão verde · anel verde · onda de água · respingo |

`js/efeitos_v39.js` expõe `FX39.draw(chave, x, y, tamanho, opções)`. Cada arquivo de herói (`js/*_v3.js`) usa a imagem quando ela já carregou e volta ao desenho por código se não. `?fx39=0` desliga.

## Animações (anim/)

13 efeitos animados em folhas 3 × 3 (768 × 768, quadros de 256, fundo preto, somam luz), gerados no Canva como sequência e recortados por script: fogo, fumaça, aura, explosaoOuro, anelOuro, corte, impactoVioleta, explosaoRubra (7 quadros), runas, explosaoVerde, anelVerde, onda, respingo. `FX39.draw(chave, …, {t})` toca uma vez (t de 0 a 1); `{loop:true}` repete a 12 quadros por segundo. Sem a animação carregada, usa a imagem parada.

## Fita de água do Corsário (ribbon.webp)

Faixa horizontal de água gerada no Canva; as pontas foram emendadas por script (20% de sobreposição com transição) para repetir sem costura, e o fundo preto virou transparência pelo brilho. `corsair36Band()` em `js/corsair_v36.js` repete a textura ao longo do braço e a desliza para dar a sensação de água correndo; o punho da arte do Corsário continua na ponta, sem esticar.

## Linhas que se repetem (linhaAgua, linhaPesca, rastroFogo)

Faixas geradas no Canva e emendadas por script: `linhaAgua` e `linhaPesca` com transição nas pontas; `rastroFogo` cortado nas duas colunas mais parecidas (sem sobreposição). `FX39.line(chave, x1, y1, x2, y2, espessura, {scroll, phase, add, upright})` repete a textura ao longo de qualquer segmento. Usos: linha do Arpão Fisgado (`js/corsario_v3.js`), linha da Fisgada (`js/cacador_v3.js`, que primeiro estica até onde o rival estava) e rastro do Passo do Amanhecer (`js/solar_v3.js`, com a textura contínua entre os segmentos e as chamas sempre para cima).

## Rastro de fogo do Passo do Amanhecer — versão v2 (Blender/pixel art)

`rastroFogo.webp` agora é uma faixa 1152 × 128 em pixel art (RGBA, ~1,4 KB; a anterior, do Canva, tinha 1348 × 129 e 140 KB e está guardada em `rastroFogo_antigo.webp` como reserva — para voltar, copie-a por cima e suba o `?v=` em `js/efeitos_v39.js`). A faixa foi recortada nos dois pontos em que as chamas se repetem exatamente (`scripts/emendar_faixa.py` também faz a transição em pixels quando não existe um corte perfeito), então a repetição do jogo não mostra emenda. O código não mudou: `FX39.line('rastroFogo', …)` em `js/solar_v3.js`.

### Versão v3 do rastro (línguas de fogo)
`rastroFogo.webp` agora é a variante B do Blender (956 × 128, 9 cores, ~1 KB), recortada no ponto exato em que a faixa se repete (`scripts/cortar_emenda.py`, diferença 0). Reservas: `rastroFogo_v2.webp` (a versão em pico, de antes) e `rastroFogo_alt37.webp` (outra variante do Blender, mais densa), `rastroFogo_antigo.webp` (a do Canva). Para trocar: copie a reserva por cima de `rastroFogo.webp` e suba o `?v=` em `js/efeitos_v39.js`. Prévia fiel: `python3 scripts/previa_rastro.py ARQ.webp previa.png --comparar assets/efeitos_v39/rastroFogo_v2.webp`.
