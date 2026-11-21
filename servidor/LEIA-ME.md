# Servidor de partidas do Eldoria

O jogo fica **instalado em cada aparelho** (hoje o mesmo código do site; depois vira APK) e cuida da tela, dos controles e da resposta
imediata. O **servidor calcula a luta de verdade** e é quem manda no resultado. As salas entre amigos (PeerJS/QR) continuam existindo.

```
 celular A ──┐                          ┌── thread da partida 1 (o jogo sem tela, 30 ticks/s)
 celular B ──┼── WebSocket ── servidor ─┼── thread da partida 2
 celular C ──┘   (fila, pareamento)     └── ...
```

## Como rodar
```bash
cd servidor && npm install
node servidor.cjs                       # porta 8787 (PORT). GET /saude mostra o estado
# no jogo: abra com ?servidor=ws://localhost:8787  (ou ponha o endereço em js/config_servidor.js)
node carga.cjs 20 30                    # teste de carga: 20 partidas (40 jogadores simulados) por 30 s
node varredura_herois.cjs               # os 10 heróis lutando sem tela
```
Variáveis: `PORT`, `AQUECIDAS` (threads prontas para começar na hora, padrão 2), `MAX_PARTIDAS` (padrão 60), `BUILD_MINIMO` (versão mínima do
jogo instalado), `ORIGENS` (lista separada por vírgula; vazio = qualquer). `TESTE=1` liga um gancho que só existe para os testes.

## Peças
- `servidor.cjs` — WebSocket, fila, pareamento (rival de liga/nível mais próximo entre os 8 primeiros), threads, `/saude`.
- `partida.cjs` — thread de UMA partida: carrega o jogo sem tela (`carregador.cjs`, jsdom + canvas falso) e roda a luta em tempo real.
- `anfitriao.js` — roda dentro do jogo da thread: comandos dos dois jogadores, ações conferidas, estado 30×/s, rodadas (melhor de 3).
- No navegador: `js/online_v45.js` (botão "Partida rápida", fila) e `js/online_luta_v46.js` (a luta: o servidor faz o papel do anfitrião).
- Mensagens (JSON, protocolo v3): `hello` (versão do protocolo + build do jogo), `fila`, `cancelar`, `ping/pong`, `match`, `in` (comandos), `act` (golpes),
  `snap` (estado), `end` (fim de rodada), `over` (fim do duelo), `bye` (rival saiu), `erro` (`versao`/`atualizar`).

## Versões diferentes do jogo instalado
O servidor roda o código da pasta do jogo que está junto dele. Quem está com versão antiga na mão simula a luta com regras antigas
(só para a resposta imediata; o resultado vem do servidor). Por isso: aumente `window.ELDORIA_BUILD` em `js/config_servidor.js` quando
mudar regras da luta ou o protocolo, e suba `BUILD_MINIMO` no servidor para recusar versões velhas com "atualize o jogo".

## Medido (4 núcleos, 16 GB; jogadores simulados andando e usando habilidades)
| Partidas ao mesmo tempo | Núcleos usados | Memória | Ticks atrasados | Atualizações por jogador |
|---|---|---|---|---|
| 10 | 0,5 | ~1,3 GB | 2 de 7.512 | 30/s |
| 24 | 1,2 | ~2,5 GB | 57 de 18.590 (0,3%) | 30/s |
- **O limite é a memória:** cerca de 90 MB por partida (uma thread por partida) contra cerca de 5% de um núcleo. Um servidor de 8 GB deve
  aguentar algo como 60 a 80 partidas (120 a 160 jogadores); 4 GB, uns 30. Isso é estimativa a partir das duas medidas acima.
- Dá para gastar menos memória colocando várias partidas por thread, em troca de um pequeno engasgo quando uma nova partida é carregada.

## O que ainda NÃO existe
Contas (moedas, nível, campeões e ranking ainda ficam no aparelho e o perfil é só o que o aparelho diz), ranking e troféus no servidor,
HTTPS/wss (o Android bloqueia `ws://` comum: no ar precisa de domínio + certificado), servidor em máquina de verdade,
revanche com o mesmo rival, reconexão depois de queda, proteção contra trapaça além da básica (limite de mensagens, ações conferidas,
posição do cliente só vale perto da do servidor), APK. WebSocket usa TCP (um pacote perdido atrasa os seguintes);
um canal sem garantia (WebRTC/WebTransport até o servidor) é uma melhoria futura.
