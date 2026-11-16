# Corsário da Maré — arte v36

Personagem original aprovado: cabelo castanho com mecha azul-petróleo, bandana e casaco azul-marinho, forro coral, faixa branca, braçadeiras de corda dourada e braços de água turquesa. Anatomia jovem sem musculatura exagerada.

Todos os arquivos são WebP sem perdas. `manifest.json` registra dimensões e SHA-256 de cada arquivo.

| Arquivos | Dimensões | Organização |
| --- | --- | --- |
| portrait.webp | 760 × 1140 | Corpo inteiro, transparente |
| reference.webp | 1536 × 1024 | Frente, lado e costas |
| body.webp | 1254 × 1254 | 36 células de 209 × 209 |
| skills.webp | 1254 × 1254 | 36 células de 209 × 209 |
| icon-0.webp até icon-5.webp | 256 × 256 cada | Um por habilidade |
| background.webp | 1536 × 1024 | Porto ao entardecer, opaco |
| punch, barrage, burst, launch, aura, charge, giant, impact.webp | 1536 × 1024 cada | 24 células de 256 × 256 |

O corpo usa as linhas repouso, corrida lateral, corrida de frente, corrida de costas, soco de água e reações (dano, dano, queda, caído, defesa, avanço). As habilidades usam uma linha por técnica: Arpão de Maré, Chuva de Ondas, Quebra-Mar, Impulso da Âncora, Maré Alta e Punho Abissal. Arpão e o ataque básico compartilham a sequência de soco de água. Pés na linha 193 e âncora horizontal 104,5; margens mínimas de 8 px. As folhas de efeitos usam formação 0–7, intensidade 8–15 e dissipação 16–23, com margens transparentes de 16 px.

`js/corsair_v36.js` conecta as poses aos eventos reais de ataque, projétil, contato, avanço e K.O. O botão de avanço usa icon-3. O kit de seis habilidades continua disponível no modo legado; a interface v3 mantém os três ataques, ultimate e avanço existentes. Maré Alta mantém sua animação e efeito no modo legado.

Validação: `node tests/corsair-v36.cjs` e, com servidor HTTP na porta 8000, `node tests/corsair-v36-integration.cjs`. A integração verifica acertos nos dois sentidos, recurso, ultimate, avanço, seis sequências no legado, cinco no v3, efeitos, K.O., proporções e interface em 1280 × 720 e 844 × 390.

O script `scripts/pack-corsair-v36.cjs` faz apenas recorte, alinhamento, dimensionamento e exportação técnica das imagens geradas. Ele identifica os espaços transparentes entre as poses antes de montar a grade final, evitando fragmentos de células vizinhas.
