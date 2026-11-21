'use strict';
// Teste de carga: sobe o servidor e liga N partidas (2N jogadores simulados) que andam e usam habilidades pela rede.
// node carga.cjs 20 30   -> 20 partidas por 30 s
const WebSocket = require('ws'), { spawn, execSync } = require('child_process'), path = require('path');
const { load } = require('./carregador.cjs');
const N = +process.argv[2] || 10, SECS = +process.argv[3] || 30, PORT = 8795;
const REMOTO = process.env.SERVIDOR_URL || '';   // ex.: SERVIDOR_URL=wss://meu.dominio.com testa um servidor que já está no ar
let agente; if (REMOTO && process.env.HTTPS_PROXY) { try { const { HttpsProxyAgent } = require('https-proxy-agent'); agente = new HttpsProxyAgent(process.env.HTTPS_PROXY); } catch {} }   // atrás de proxy (ambientes restritos)
const WS_URL = REMOTO || `ws://localhost:${PORT}`, HTTP_URL = REMOTO ? REMOTO.replace(/^ws/, 'http') : `http://localhost:${PORT}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const g = await load('?allheroes=1');
  const KITS = JSON.parse(g.ev('JSON.stringify(CHAMPIONS.map(c=>c.kit))'));
  const sv = REMOTO ? null : spawn('node', ['servidor.cjs'], { cwd: __dirname, env: { ...process.env, PORT: String(PORT), MAX_PARTIDAS: '200', AQUECIDAS: '4' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; if (sv) { sv.stdout.on('data', d => log += d); sv.stderr.on('data', d => log += d); }
  const saude = () => fetch(`${HTTP_URL}/saude`).then(r => r.json());
  for (let i = 0; i < 40; i++) { try { await saude(); break; } catch { await sleep(250); } }
  const bots = []; let matches = 0, snaps = 0, acts = 0, bye = 0, over = 0;
  const lat = [];
  function bot(i) {
    const hero = i % 10, ws = new WebSocket(WS_URL, agente ? { agent: agente } : undefined), b = { ws, hero, snaps: 0, on: false, slot: 0 };
    ws.on('open', () => { ws.send(JSON.stringify({ t: 'hello', v: 3, p: { name: 'Bot' + i, hero, lv: 1 + (i % 7), tier: i % 3, league: 'Bronze' } })); ws.send(JSON.stringify({ t: 'fila' })); });
    ws.on('message', d => {
      const m = JSON.parse(d);
      if (m.t === 'match') { matches++; b.on = true; b.slot = m.slot; }
      else if (m.t === 'snap') { snaps++; b.snaps++; b.last = m; }
      else if (m.t === 'act') acts++;
      else if (m.t === 'bye') bye++;
      else if (m.t === 'over') over++;
      else if (m.t === 'pong') lat.push(Date.now() - m.at);
    });
    // comportamento: muda de direção 3×/s, usa uma habilidade a cada ~1,2 s, pinga a cada 2 s
    b.timer = setInterval(() => {
      if (ws.readyState !== 1 || !b.on) return;
      const a = Math.random() * 6.28;
      ws.send(JSON.stringify({ t: 'in', x: Math.cos(a), y: Math.sin(a), l: 1, a, g: 0 }));
    }, 330);
    b.timer2 = setInterval(() => {
      if (ws.readyState !== 1 || !b.on) return;
      const kit = KITS[hero], id = kit[Math.floor(Math.random() * 3)], s = b.last ? b.last.g : { x: 0, y: 0 };
      ws.send(JSON.stringify({ t: 'act', f: 'cast', a: Math.random() * 6.28, x: s.x, y: s.y, args: [id] }));
    }, 1200 + Math.random() * 300);
    b.timer3 = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'ping', at: Date.now() })); }, 2000);
    return b;
  }
  const t0 = Date.now();
  for (let i = 0; i < N * 2; i++) { bots.push(bot(i)); await sleep(60); }
  console.log(`${N * 2} jogadores conectados em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  // espera as partidas começarem (cada uma carrega o jogo numa thread)
  for (let i = 0; i < 120; i++) { if (matches >= N * 2) break; await sleep(500); }
  const s0 = await saude();
  console.log(`partidas começadas: ${matches / 2} de ${N} | threads ativas: ${s0.partidas}`);
  const pid = sv ? sv.pid : 0, cpuAntes = sv ? +execSync(`ps -o cputimes= -p ${pid}`).toString() : 0, sn0 = snaps, c0 = Date.now();
  await sleep(SECS * 1000);
  const dt = (Date.now() - c0) / 1000, cpu = sv ? +execSync(`ps -o cputimes= -p ${pid}`).toString() - cpuAntes : 0;
  const s1 = await saude();
  // cpu das threads conta no mesmo processo
  const rssTotal = sv ? +execSync(`ps -o rss= -p ${pid}`).toString() / 1024 : s1.memoriaMB;
  lat.sort((a, b) => a - b);
  console.log(JSON.stringify({
    partidas: s1.partidas, jogadores: s1.jogadores, snaps_por_s_por_jogador: +(((snaps - sn0) / dt) / (N * 2)).toFixed(1),
    nucleos_usados: sv ? +(cpu / dt).toFixed(2) : 'n/d (servidor remoto)', memoria_MB: Math.round(rssTotal), MB_por_partida: Math.round(rssTotal / Math.max(1, s1.partidas)),
    tick_medio_ms: s1.tickMedio, tick_max_ms: s1.tickMax, ticks_atrasados: `${s1.ticksTarde} de ${s1.ticks}`, erros_servidor: s1.erros, ultimo_erro: s1.ultimoErro,
    acoes_repetidas: acts, avisos_bye: bye, partidas_terminadas: s1.partidasTerminadas, ping_p50_ms: lat[Math.floor(lat.length / 2)], ping_p95_ms: lat[Math.floor(lat.length * .95)],
  }));
  for (const b of bots) { clearInterval(b.timer); clearInterval(b.timer2); clearInterval(b.timer3); try { b.ws.close(); } catch {} }
  if (sv) sv.kill(); process.exit(0);
})();
