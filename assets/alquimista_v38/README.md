# Alquimista de Aço — arte v38

Herói 9, jovem artífice original da pedra e do metal. Cabelo preto curto com mecha cinza-aço, óculos de forja na testa, olhos âmbar, bochechas com poeira e expressão concentrada. Avental de couro marrom sobre camisa areia, mangas arregaçadas, luvas de forja com placas nos dedos, frascos e ferramentas no cinto, botas pesadas. A mesma identidade aparece no retrato, referência, corpo, habilidades e ícones. Proporções compactas comparadas com Ninja, Corsário e Cavaleiro; qualidade visual conferida também com os cinco primeiros heróis.

Os 21 arquivos são WebP sem perdas. `manifest.json` registra dimensões, transparência, SHA-256, organização e integração.

| Arquivos | Dimensões | Organização |
| --- | --- | --- |
| portrait.webp | 760 × 1140 | Corpo inteiro, transparente |
| reference.webp | 1536 × 1024 | Frente, lado e costas, transparente |
| body.webp | 1254 × 1254 | 36 células de 209 × 209 |
| skills.webp | 1254 × 1254 | 36 células de 209 × 209 |
| icon-0.webp a icon-4.webp | 256 × 256 cada | Quadrados preenchidos, sem moldura interna; recorte circular da interface |
| background.webp | 1536 × 1024 | Oficina-forja de pedra com bigornas, opaca |
| block, wall, throw, impact, colossus.webp | 1536 × 1024 cada | 24 células de 256 × 256; integradas aos eventos e objetos atuais |
| steel, shatter, spikes, lance, aim, charge.webp | 1536 × 1024 cada | 24 células de 256 × 256; entregues para a jogabilidade futura, sem integração |

Leitura da esquerda para a direita. Corpo: repouso, corrida lateral, corrida de frente, corrida de costas, palma básica e reações (dano, dano, queda, caído, defesa, avanço). Pés na linha 193, âncora horizontal 104,5, margem mínima de 8 px e repouso com até 173 px. A preparação técnica preserva as proporções dos desenhos.

Habilidades: Palma Forjadora, Lâmina/Lança, Muralha Instantânea, Deslize, Colosso de Pedra e vitória. Cada linha contém seis poses de preparação, execução e recuperação. A Palma serve tanto para criar quanto para arremessar o bloco; a Lâmina faz o corte e termina com gesto de puxar. A Muralha usa as duas mãos no chão; o Deslize arrasta uma mão; a ultimate abre os braços. A integração não cria lanças nem qualquer mecânica futura.

As folhas de efeitos usam formação 0–7, intensidade 8–15 e dissipação 16–23, com margens transparentes de pelo menos 16 px. `charge.webp` usa as faixas como estados apagado, meia carga e carga completa. Runas quadradas e angulosas de pedreiro, pedra bege, aço azulado e energia âmbar.

`js/alquimista_arte_v38.js` carrega imediatamente depois de `js/eclipse_v3.js`. Liga retrato, seleção, HUD, ícones, poses, K.O., projétil da Palma, impactos e construções aos dados reais. Os slots v3 são kit 0 → linha/ícone 0; kit 1 → linha/ícone 1; kit 3 (Muralha) → linha/ícone 2; Deslize genérico → linha/ícone 3; kit 5 → linha/ícone 4. O estilo do botão de Deslize troca a seta pelo ícone sem alterar seu comando ou recarga.

Blocos usam a largura real de 30, muralhas o comprimento de 126 e o Colosso a altura de `o.size`, de 105 a 185. A muralha vertical usa a mesma arte girada. Posição, colisão, vida, duração, custo e dano continuam sendo definidos pelos objetos e pelo motor original. A camada visual apenas observa o desaparecimento/destruição das construções para mostrar seu desmoronamento. A barra de vida existente permanece.

O recorte explícito do rosto é x=210, y=50, 380 × 380 no retrato de 760 × 1140, com saída de 96 × 96, compartilhado por HUD e seleção. `css/alquimista_arte_v38.css` aplica a oficina à página do personagem e os ícones preenchidos aos botões.

Validação com servidor HTTP na porta 8000, abrindo `index.html?allheroes=1`:

- `node tests/alquimista-arte-v38.cjs`: dimensões, formato sem perdas, 336 quadros distintos, alinhamento, margens, transparência e hashes; compara resultados reais de combate com a nova camada visual ativada e desativada; verifica poses nos dois sentidos, blocos, muralhas nas duas orientações, Colosso, desmoronamento, K.O., proporções, rosto e cinco ícones em 1280 × 720 e 844 × 390. Confirma que as seis folhas futuras não são carregadas pela integração.
- `node tests/herois-v3.cjs`: regras atuais dos cinco primeiros heróis.
- `node tests/combate-v3.cjs`: interface, habilidades, avanços, custos/recargas e duelo dos bots.

O novo teste aceita `--assets-only` e `--game-only`, usando `/usr/bin/chromium` ou `CHROMIUM_PATH`. Os testes existentes usam o navegador configurado no Playwright. Os arquivos de jogabilidade foram preservados; seus hashes de base constam no manifesto.

`scripts/pack-alquimista-v38.cjs` faz apenas preparação técnica: separação das células, recorte, escala proporcional, alinhamento e exportação. Uso: `node scripts/pack-alquimista-v38.cjs nome origem.png [linhasDaOrigem]`. Fontes com quadros extras podem ser amostradas na ordem temporal para entregar exatamente 24 células.

## Golem em 4 ângulos (golem4.webp)

`golem4.webp` (1024 × 768, WebP sem perdas, 12 células de 256 × 256, pés na linha 240) foi gerado no Canva a partir do Golem anterior e recortado/alinhado por script. Colunas: frente, 3/4, perfil (virado para a direita; o jogo espelha para a esquerda) e costas. Linhas: parado, andando e atacando. `js/alquimista_arte_v38.js` (`alc38Golem4`) escolhe o ângulo pela direção do Golem (`o.angle`), alterna parado/andando ao se mover e usa a pose de soco quando ele ataca. A formação e o desmoronamento continuam usando `colossus.webp`.
