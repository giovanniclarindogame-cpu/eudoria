'use strict';
/*
 * Servidor de partidas do Eldoria (etapa 1): fila de partida rápida 1×1 + luta calculada no servidor.
 *  - WebSocket (ws) na porta PORT (padrão 8787). Mensagens JSON; protocolo v3.
 *  - Cada partida roda numa thread própria (partida.cjs, o jogo sem tela). Threads "aquecidas" ficam prontas para começar na hora.
 *  - GET /saude mostra jogadores, fila, partidas e a saúde dos ticks.
 * Variáveis: PORT, BUILD_MINIMO (versão mínima do jogo instalado aceita), AQUECIDAS (threads prontas, padrão 2), MAX_PARTIDAS (padrão 60), ORIGENS (lista separada por vírgula; vazio = qualquer).
 */
const http = require('http'), path = require('path'), os = require('os');
const { WebSocketServer } = require('ws');
const { Worker } = require('worker_threads');
const PORT = +process.env.PORT || 8787, AQUECIDAS = process.env.AQUECIDAS != null ? +process.env.AQUECIDAS : 2, MAX_PARTIDAS = +process.env.MAX_PARTIDAS || 60;
const ORIGENS = (process.env.ORIGENS || '').split(',').map(s => s.trim()).filter(Boolean);
const PROTO = 3, BUILD_MINIMO = +process.env.BUILD_MINIMO || 1;   // jogo instalado em versão mais antiga que BUILD_MINIMO precisa atualizar
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const jogadores = new Map();      // ws -> { id, perfil, estado: 'novo'|'ocioso'|'fila'|'partida'|'fim', partida, slot }
const fila = [];                  // jogadores esperando o 1×1
const fila2 = [];                 // jogadores esperando o 2×2 (a partida sai quando juntam 4)
const filaDe = j => j.modo === '2v2' ? fila2 : fila;
const partidas = new Map();       // id -> { id, worker, jog: [j0, j1] (ou 4 no 2×2), fim, criada }
const aquecidas = [];             // workers prontos esperando uma partida
const stats = { partidasCriadas: 0, partidasTerminadas: 0, tickMedio: 0, ticksTarde: 0, ticks: 0, tickMax: 0, erros: 0, ultimoErro: '' };
let proxId = 1;

/* ---------- threads ---------- */
function novoWorker() {
  const w = new Worker(path.join(__dirname, 'partida.cjs'));
  const e = { w, pronta: false, esperando: [], p: null };
  w.on('message', m => tratarWorker(e, m));
  w.on('error', err => { stats.erros++; stats.ultimoErro = String(err.message).slice(0, 160); log('erro na thread:', stats.ultimoErro); encerrarPorErro(e); });
  w.on('exit', () => { const i = aquecidas.indexOf(e); if (i >= 0) aquecidas.splice(i, 1); if (e.p && partidas.has(e.p.id)) encerrarPorErro(e); });
  return e;
}
function reporAquecidas() { while (aquecidas.length < AQUECIDAS && partidas.size + aquecidas.length < MAX_PARTIDAS) aquecidas.push(novoWorker()); }
function tratarWorker(e, m) {
  if (m.k === 'pronta') { e.pronta = true; if (m.erros) log('aviso: o jogo carregou com', m.erros, 'erros'); const f = e.esperando; e.esperando = []; f.forEach(fn => fn()); }
  else if (m.k === 'send') { const p = e.p; if (!p) return; enviarPara(p, m.slot, m.m); }
  else if (m.k === 'fim') { const p = e.p; if (!p || p.fim) return; p.fim = true; stats.partidasTerminadas++; setTimeout(() => encerrar(p), 20000).unref(); }
  else if (m.k === 'stats') { stats.ticks += m.ticks; stats.ticksTarde += m.tarde; stats.tickMedio = stats.tickMedio * .8 + m.media * .2; stats.tickMax = Math.max(stats.tickMax * .9, m.max); }
  else if (m.k === 'erro') { stats.erros++; stats.ultimoErro = m.m; }
}

/* ---------- envio ---------- */
function enviar(ws, texto) {
  if (ws.readyState !== 1) return;
  if (texto.startsWith('{"t":"snap"') && ws.bufferedAmount > 32768) return;   // cliente lento: pula o estado (o próximo substitui)
  ws.send(texto);
}
function enviarPara(p, slot, texto) {
  if (slot === -1) { for (const j of p.jog) enviar(j.ws, texto); return; }
  const j = p.jog[slot]; if (j) enviar(j.ws, texto);
}

/* ---------- jogadores ---------- */
const limpo = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
function perfil(p = {}) {
  return {
    name: limpo(p.name || 'Lutador', 16) || 'Lutador', lv: Math.max(1, Math.min(100, +p.lv || 1)),
    frame: /^[a-z]{2,10}$/.test(p.frame) ? p.frame : 'azul', photo: /^[hs]\d+$/.test(p.photo || '') ? p.photo : 'h0',
    hero: Math.max(0, Math.min(9, Math.floor(+p.hero) || 0)), tier: Math.max(0, Math.min(5, +p.tier || 0)), league: limpo(p.league || 'Bronze', 20),
  };
}
function sair(j) {
  for (const f of [fila, fila2]) { const i = f.indexOf(j); if (i >= 0) f.splice(i, 1); }
  const p = j.partida; j.partida = null; jogadores.delete(j.ws);
  if (!p) return;
  if (!p.fim) {   // saiu no meio da luta: avisa os outros e fecha a partida
    for (const o of p.jog) if (o !== j && o.partida === p && o.ws.readyState === 1) enviar(o.ws, JSON.stringify({ t: 'bye' }));
    encerrar(p);
  } else if (p.jog.every(x => x.partida !== p)) encerrar(p);
}
function entrarNaFila(j, modo) {
  if (j.partida) { const p = j.partida; j.partida = null; if (p.fim && p.jog.every(x => x.partida !== p)) encerrar(p); }
  for (const f of [fila, fila2]) { const i = f.indexOf(j); if (i >= 0) f.splice(i, 1); }
  j.modo = modo === '2v2' ? '2v2' : '1v1';
  const f = filaDe(j); f.push(j);
  j.estado = 'fila';
  f.forEach((x, i) => enviar(x.ws, JSON.stringify({ t: 'fila', pos: i + 1, n: f.length, precisa: j.modo === '2v2' ? 4 : 2, online: jogadores.size })));
  tentarParear();
}
function tentarParear() {
  for (const [f, tam] of [[fila, 2], [fila2, 4]]) {
    while (f.length >= tam) {
      if (partidas.size >= MAX_PARTIDAS) { f.forEach(x => enviar(x.ws, JSON.stringify({ t: 'cheio' }))); break; }
      // quem espera há mais tempo + os de nível mais próximo entre os primeiros
      const a = f.shift(), grupo = [a];
      while (grupo.length < tam) {
        let k = 0, melhor = 1e9;
        for (let i = 0; i < Math.min(f.length, 8); i++) { const d = Math.abs(f[i].perfil.tier - a.perfil.tier) * 10 + Math.abs(f[i].perfil.lv - a.perfil.lv) / 10; if (d < melhor) { melhor = d; k = i; } }
        grupo.push(f.splice(k, 1)[0]);
      }
      // 2×2: a equipe 0 é o mais antigo da fila + o último escolhido (os dois extremos), a equipe 1 os do meio
      criarPartida(tam === 4 ? [grupo[0], grupo[3], grupo[1], grupo[2]] : grupo, tam === 4 ? '2v2' : '1v1');
    }
  }
}
function criarPartida(jog, modo) {
  const id = proxId++, e = aquecidas.shift() || novoWorker();
  // a luta só começa quando todos terminam de carregar (mensagem 'pronto'); jogos de versão antiga (build < 2) não avisam: contam como prontos
  const p = { id, e, jog, modo, fim: false, criada: Date.now(), prontos: jog.map(j => j.build < 2), iniciada: false, liberada: false, timerLiberar: null };
  e.p = p; partidas.set(id, p); stats.partidasCriadas++;
  jog.forEach((j, i) => { j.partida = p; j.slot = i; j.estado = 'partida'; });
  const seed = (Math.random() * 4294967296) | 0;
  const iniciar = () => {
    if (modo === '2v2') {
      const hs = jog.map(j => j.perfil.hero), ps = jog.map(j => j.perfil);
      for (const j of jog) enviar(j.ws, JSON.stringify({ t: 'match', modo, slot: j.slot, seed, hs, ps }));
      e.w.postMessage({ k: 'iniciar', modo, seed, h: hs, n: jog.map(j => j.perfil.name) });
    } else {
      const [a, b] = jog;
      const mk = (j, o) => JSON.stringify({ t: 'match', slot: j.slot, seed, hh: o.perfil.hero, gh: j.perfil.hero, them: o.perfil });
      enviar(a.ws, mk(a, b)); enviar(b.ws, mk(b, a));
      e.w.postMessage({ k: 'iniciar', seed, h0: a.perfil.hero, h1: b.perfil.hero, n0: a.perfil.name, n1: b.perfil.name });
    }
    p.iniciada = true; p.timerLiberar = setTimeout(() => liberar(p), 30000); checarLiberar(p);
  };
  if (e.pronta) iniciar(); else e.esperando.push(iniciar);
  log(`partida ${id} (${modo}): ${jog.map(j => j.perfil.name).join(' × ')} (ativas: ${partidas.size})`);
  setImmediate(reporAquecidas);
}
function checarLiberar(p) { if (!p.liberada && p.iniciada && p.prontos.every(Boolean)) liberar(p); }
function liberar(p) { if (p.liberada) return; p.liberada = true; clearTimeout(p.timerLiberar); try { p.e.w.postMessage({ k: 'liberar' }); } catch {} }
function encerrar(p) {
  if (!partidas.has(p.id)) return;
  clearTimeout(p.timerLiberar);
  partidas.delete(p.id);
  try { p.e.w.postMessage({ k: 'parar' }); } catch {}
  setTimeout(() => { try { p.e.w.terminate(); } catch {} }, 500).unref();
  for (const j of p.jog) if (j.partida === p) { j.partida = null; if (j.estado === 'partida' || j.estado === 'fim') j.estado = 'ocioso'; }
}
function encerrarPorErro(e) {
  const p = e.p; if (!p || !partidas.has(p.id)) return;
  for (const j of p.jog) enviar(j.ws, JSON.stringify({ t: 'bye' }));
  encerrar(p);
}

/* ---------- mensagens dos jogadores ---------- */
function tratar(j, texto) {
  let m; try { m = JSON.parse(texto); } catch { return; }
  if (!m || typeof m.t !== 'string') return;
  if (j.estado === 'novo') {
    if (m.t !== 'hello') return;
    if (m.v !== PROTO) { enviar(j.ws, JSON.stringify({ t: 'erro', m: 'versao' })); return j.ws.close(); }
    if ((+m.build || 1) < BUILD_MINIMO) { enviar(j.ws, JSON.stringify({ t: 'erro', m: 'atualizar', minimo: BUILD_MINIMO })); return j.ws.close(); }
    j.perfil = perfil(m.p); j.build = +m.build || 1; j.estado = 'ocioso';
    return enviar(j.ws, JSON.stringify({ t: 'hello', ok: 1, online: jogadores.size, v: PROTO, modos: ['1v1', '2v2'] }));
  }
  switch (m.t) {
    case 'ping': return enviar(j.ws, JSON.stringify({ t: 'pong', at: m.at }));
    case 'perfil': j.perfil = perfil(m.p); return;
    case 'fila': if (j.estado === 'fila' || (j.partida && !j.partida.fim)) return; if (m.p) j.perfil = perfil(m.p); entrarNaFila(j, m.modo); return;
    case 'cancelar': { for (const f of [fila, fila2]) { const i = f.indexOf(j); if (i >= 0) f.splice(i, 1); } if (j.estado === 'fila') j.estado = 'ocioso'; return enviar(j.ws, JSON.stringify({ t: 'ocioso' })); }
    case 'pronto': if (j.partida && !j.partida.fim) { j.partida.prontos[j.slot] = true; checarLiberar(j.partida); } return;
    case 'in': if (j.partida && !j.partida.fim) j.partida.e.w.postMessage({ k: 'in', slot: j.slot, m }); return;
    case 'act': if (j.partida && !j.partida.fim) j.partida.e.w.postMessage({ k: 'act', slot: j.slot, m }); return;
    case 'teste': if (process.env.TESTE === '1' && j.partida) j.partida.e.w.postMessage({ k: 'teste', m }); return;   // só nos testes
  }
}

/* ---------- http + websocket ---------- */
const servidor = http.createServer((req, res) => {
  if (req.url === '/saude' || req.url === '/') {
    const mem = process.memoryUsage();
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    return res.end(JSON.stringify({ ok: true, proto: PROTO, buildMinimo: BUILD_MINIMO, jogadores: jogadores.size, fila: fila.length, fila2: fila2.length, partidas: partidas.size, aquecidas: aquecidas.filter(x => x.pronta).length, ...stats, tickMedio: +stats.tickMedio.toFixed(3), tickMax: +stats.tickMax.toFixed(2), memoriaMB: Math.round(mem.rss / 1048576), nucleos: os.cpus().length, uptime: Math.round(process.uptime()) }));
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server: servidor, maxPayload: 4096, perMessageDeflate: false });
wss.on('connection', (ws, req) => {
  if (ORIGENS.length && !ORIGENS.includes(req.headers.origin || '')) return ws.close(1008, 'origem');
  const j = { ws, id: proxId++, perfil: null, estado: 'novo', partida: null, slot: 0, msgs: 0, desde: Date.now() };
  jogadores.set(ws, j);
  const hello = setTimeout(() => { if (j.estado === 'novo') ws.close(1008, 'sem hello'); }, 8000);
  ws.on('message', d => {
    const agora = Date.now(); if (agora - j.desde > 1000) { j.desde = agora; j.msgs = 0; }
    if (++j.msgs > 240) return ws.close(1008, 'muitas mensagens');
    tratar(j, d.toString());
  });
  ws.on('close', () => { clearTimeout(hello); sair(j); });
  ws.on('error', () => {});
});
// derruba conexões mortas
setInterval(() => { for (const ws of wss.clients) { if (ws.vivo === false) { ws.terminate(); continue; } ws.vivo = false; try { ws.ping(); } catch {} } }, 15000).unref();
wss.on('connection', ws => { ws.vivo = true; ws.on('pong', () => { ws.vivo = true; }); });
servidor.listen(PORT, () => { log(`servidor de partidas na porta ${PORT} · protocolo ${PROTO} · ${AQUECIDAS} threads aquecidas`); reporAquecidas(); });
process.on('SIGTERM', () => { log('encerrando'); process.exit(0); });
