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
