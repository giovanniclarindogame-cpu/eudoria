# Servidor de partidas — experimento de viabilidade

Roda o jogo atual (`index.html` + `js/*.js`) **sem navegador**, em Node, com jsdom e um canvas falso, para que o servidor
calcule as lutas. Nenhum desses arquivos é usado pelo site.

```bash
cd servidor && npm install
node carregador.cjs                 # carrega o jogo e imprime o estado
node varredura_herois.cjs           # os 10 heróis lutando sem tela (relógio simulado)
node medir_partidas.cjs 20 12       # 20 partidas numa thread, 12 s
node medir_processos.cjs 4 10 15    # 4 processos × 10 partidas
```
`medir_chromium.cjs` faz a mesma medida com o jogo dentro do Chromium (precisa do site em `localhost:8000` e do Playwright).

## Resultados (4 núcleos, 16 GB, partidas de dois computadores lutando sem parar)
| | Node + jsdom | Chromium sem tela |
|---|---|---|
| Memória por partida | ~12 MB | ~400 MB |
| Processador por partida (30 ticks/s) | ~2% de um núcleo | ~19% de um núcleo |
| Partidas cabendo em 4 núcleos a 30 ticks/s | 40 testadas, sobra folga | ~20 |
| Carregar uma partida | ~0,5 s | segundos |

Desligar a atualização da interface (`updateUI`, `announce`, `toast`, `hydrateSkillIcons`, `refreshModeKit`, `drawStrips`) derruba o tick
de ~8 ms para ~0,5 ms. A tela de tutorial da primeira luta precisa ser marcada como vista (`RetQA.set({tutorial:true})`).
A sequência de K.O. usa `performance.now()`: no servidor ela anda em tempo real; nos testes acelerados o relógio é simulado.

## O que ainda NÃO foi feito
Rede (WebSocket), comandos dos jogadores, envio do estado, fila, contas e ranking. Os testes usam o computador do jogo nos dois lados.
