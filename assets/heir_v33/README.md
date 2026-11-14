# Herdeiro da Centelha — pacote de arte v33

Campeão 7 (índice 6 no código). Retrato aprovado como referência: jovem de cabelo verde-escuro com mecha branca, traje escuro de artes marciais, faixa laranja, luvas enfaixadas e botas. Anatomia compacta, contorno escuro, cores saturadas e energia verde.

**17 WebPs sem perdas.** Personagem, ícones e efeitos têm fundo transparente; o cenário é opaco.

| Arquivo | Conteúdo |
|---|---|
| `portrait.webp` | 760 × 1140, corpo inteiro em chute aéreo, sorriso confiante e raios verdes. |
| `body.webp` | 1254 × 1254, 36 células de 209 × 209 em 6 × 6. |
| `icon-0.webp` | 256 × 256, Impacto Esmeralda. |
| `icon-1.webp` | 256 × 256, Chute Relâmpago. |
| `icon-2.webp` | 256 × 256, Salto Ricochete. |
| `icon-3.webp` | 256 × 256, Estalo de Vento; também usado no botão de dash. |
| `icon-4.webp` | 256 × 256, Corpo Energizado. |
| `icon-5.webp` | 256 × 256, Limite Rompido. |
| `background.webp` | 1536 × 1024, dojo antigo à noite, relâmpagos verdes e iluminação dourada. |
| `kick.webp` | Arco de chute com faíscas verdes. |
| `charge.webp` | Energia convergindo para o punho, do verde ao branco-esverdeado. |
| `punch.webp` | Acerto do soco carregado, anel de choque e raios verdes. |
| `leap.webp` | Decolagem, rastro aéreo, poeira e anel de impacto do pouso. |
| `dash.webp` | Vento comprimido e linhas de velocidade para a direita. |
| `aura.webp` | Raios ao redor do corpo, com centro transparente. |
| `limit.webp` | Explosão da ultimate, raios verdes e brancos, anel e clarão. |
| `impact.webp` | Contato e explosão no ar, sem placa de chão. |

**Corpo:** linhas 1–5: repouso, corrida lateral, frontal, de costas e ataques. Linha 6: 30 reação, 31 recuperação, 32 queda para trás, 33 deitado de olhos fechados, 34 defesa, 35 avanço. Pés na linha **y = 193**, eixo horizontal **104,5**, repouso com altura máxima **173 px**. Na arena, repouso de aproximadamente 73 px, como os demais campeões. O K.O. passa pela queda e mantém o corpo deitado.

**Efeitos:** cada folha tem **1536 × 1024**, 6 × 4 células de **256 × 256**, lidas da esquerda para a direita. Quadros **0–7 formação**, **8–15 intensidade**, **16–23 dissipação**. No salto, o rastro antecede o anel do pouso. São **192 quadros distintos**, todos com margem transparente mínima de **16 px**, sem névoa branca ou fundo quadrado.

Integração em `js/heir_v33.js` e `css/heir_v33.css`. Preserva dano, Sobrecarga, recargas, salto duplo e custos da ultimate. Inclui carga visível, cancelamento por dano, dash da interface atual e disparo do modo legado.

Empacotamento: `node scripts/pack-heir-v33.cjs /pasta/dos/pngs` (corpo, estados especiais, ícones, cenário e efeitos; retrato aprovado exportado separadamente).

Validação: `node tests/heir-v33.cjs`. Com servidor local na porta 8000: `node tests/heir-v33-integration.cjs` e `node tests/pixel-style.cjs`.
