# Lutador do Eclipse — pacote de arte v30

Identidade original: `assets/portraits/campeao_05.webp`, preservado sem alterações. Corpo e ícones usam cabelo branco, faixa roxa sobre os olhos, anatomia compacta de combate e traje escuro com detalhes roxos. Revisão visual 31: nova pose de seleção com eclipse sobre a palma aberta; corpo com cabeça maior, tronco e pernas curtos, na proporção dos quatro primeiros campeões.

Todos os arquivos são **WebP sem perdas**. Corpo e efeitos têm fundo transparente; os ícones têm transparência fora da moldura arredondada. O cenário de seleção é opaco, como nos outros pacotes.

| Arquivo | Conteúdo |
|---|---|
| `portrait.webp` | 760 × 1140; nova pose de seleção, mão na cintura e eclipse sobre a outra palma, fundo transparente. |
| `body.webp` | 1254 × 1254; 6 × 6 células de 209 × 209. Linhas: repouso, corrida lateral, frontal, costas, ataques. Última linha: reação, recuperação, queda, caído, defesa, avanço. |
| `icon-0.webp` | Repulsão: palma lançando onda azul. |
| `icon-1.webp` | Atração: mão puxando um vórtice violeta. |
| `icon-2.webp` | Esfera Rubra: lançamento da esfera vermelha. |
| `icon-3.webp` | Teleporte Curto: avanço através de distorção azul-clara. |
| `icon-4.webp` | Barreira Cósmica: defesa dentro da bolha de energia. |
| `icon-5.webp` | Abismo Silente: selo de mãos diante do domínio estrelado. |
| `background.webp` | 1536 × 1024; santuário noturno, céu de eclipse, azul-escuro e violeta. |
| `repulse.webp` | Anel azul expansivo com fragmentos. |
| `attract.webp` | Vórtice violeta que se concentra no centro. |
| `red.webp` | Carga, esfera com rastro para a esquerda e explosão; voo para a direita. |
| `teleport.webp` | Anel vertical azul-claro, distorção e partículas; reutilizável na saída e chegada. |
| `barrier.webp` | Bolha inteira, rachaduras progressivas e estilhaçamento. |
| `domain.webp` | Esfera preta de borda violeta, estrelas internas, colapso e onda de choque. |
| `impact.webp` | Contato e explosão azul-violeta no ar, sem placa de chão. |

Ícones: **256 × 256**. Cada folha de efeitos: **1536 × 1024**, 6 × 4 células de **256 × 256**, leitura da esquerda para a direita. Quadros **0–7**: formação; **8–15**: intensidade; **16–23**: dissipação. A barreira usa esses intervalos para inteira/rachada/estilhaçando. São atlas estáticos, não WebP animado.

O corpo tem os pés na linha **y = 193** de cada célula e altura máxima de repouso de **173 px**. Para a escala do elenco, normalize essa altura para aproximadamente **73 px** em combate, mantendo o apoio dos pés em **y = 9** relativo ao ator. Use centro horizontal fixo **104,5**, espelhamento horizontal para olhar à esquerda e respiração ancorada nos pés. Os efeitos têm margem transparente de pelo menos **16 px** em cada célula; o brilho interno é preservado.

Exportação: `node scripts/import-eclipse-v30.cjs /pasta/dos/pngs`.
Para revisar apenas corpo e retrato: `node scripts/import-eclipse-v30.cjs /pasta/com/body-e-portrait-png --character-only`.
Validação: `node tests/eclipse-v30.cjs`.

## Integração no jogo

`js/eclipse_v30.js` conecta o corpo, os ícones e os sete efeitos aos eventos existentes de combate; `css/eclipse_v30.css` aplica o cenário da seleção. O retrato de seleção aponta para `assets/eclipse_v30/portrait.webp?v=31`; a referência original fica preservada. O corpo é desenhado diretamente na resolução do canvas, como os quatro primeiros campeões. A barreira segue sua ativação, absorção e quebra; o domínio segue a duração real da zona. O modo atual mantém três habilidades + ultimate, dash dedicado e barreira passiva; o modo legado mantém os seis slots.

Com um servidor em `http://127.0.0.1:8000`, execute `node tests/eclipse-v30-integration.cjs` para verificar a integração em ambos os modos, incluindo seleção em desktop e celular.

## Revisão 33 — Repulsão e carga do Abismo Silente

`repulse.webp` foi refeito com somente anel azul e fragmentos sobre transparência real, sem placa clara ou névoa branca. Mantém 24 células, margens transparentes e WebP sem perdas. A Repulsão usa diretamente o alfa da arte, sem a limpeza de névoa aplicada aos outros efeitos.

O Abismo Silente mostra uma esfera pequena junto às mãos nos primeiros 0,2 s. Durante os 0,25 s seguintes, a esfera cresce na área marcada, antes da ativação do domínio. A zona abre em aproximadamente 0,45 s (antes: 1,05 s). Raio 150, duração ativa de 3 s e recarga de 32 s permanecem iguais. A descrição da habilidade e as versões de cache acompanham a alteração.

Validação da revisão: `tests/eclipse-v30.cjs` e `tests/eclipse-v30-integration.cjs` passam, incluindo transparência do interior dos anéis, carga visível, janela de aviso e ativação do domínio nos modos atual e legado. O teste geral `tests/six-identities.cjs` ainda falha em `cast 0/4/R` (Guerreiro Astral); a mesma falha foi reproduzida com os scripts anteriores à revisão.
