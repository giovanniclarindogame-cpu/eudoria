'use strict';
/*
 * Servidor de partidas do Eldoria: filas (1×1, 2×2, Trio, Coroa) + luta calculada no servidor.
 *  - WebSocket (ws) na porta PORT (padrão 8787). Mensagens JSON; protocolo v3.
 *  - Cada partida roda numa thread própria (partida.cjs, o jogo sem tela). Threads "aquecidas" ficam prontas para começar na hora.
 *  - Cada partida tem "vagas" (slots): cada vaga é um jogador ou um BOT (IA difícil). Se ninguém mais entra na fila em ESPERA_BOT (30 s),
 *    bots completam as vagas que faltam. Se um jogador sai no meio da luta, um bot assume o campeão dele; se ele voltar (mensagem
 *    'reconectar' com o mesmo token do 'hello'), o bot sai e ele volta a controlar.
 *  - GET /saude mostra jogadores, filas, partidas e a saúde dos ticks.
 * Variáveis: PORT, BUILD_MINIMO (versão mínima do jogo instalado aceita), AQUECIDAS (threads prontas, padrão 2), MAX_PARTIDAS (padrão 60),
 *            ORIGENS (lista separada por vírgula; vazio = qualquer), ESPERA_BOT (ms na fila até entrarem bots, padrão 30000),
 *            TEMPO_SELECAO (ms para escolher o campeão), TEMPO_VOLTA (ms que a partida espera se só sobrarem bots, padrão 90000).
 */
const http = require('http'), path = require('path'), os = require('os');
const { WebSocketServer } = require('ws');
const { Worker } = require('worker_threads');
const contas = require('./contas.cjs');
const feedback = require('./feedback.cjs');
const PORT = +process.env.PORT || 8787, AQUECIDAS = process.env.AQUECIDAS != null ? +process.env.AQUECIDAS : 2, MAX_PARTIDAS = +process.env.MAX_PARTIDAS || 60;
const crypto = require('crypto');
const ORIGENS = (process.env.ORIGENS || '').split(',').map(s => s.trim()).filter(Boolean);
const TEMPO_SELECAO = +process.env.TEMPO_SELECAO || 30000;   // tempo para escolher o campeão depois de achar os rivais
const ESPERA_BOT = process.env.ESPERA_BOT != null ? +process.env.ESPERA_BOT : 30000;   // fila sem encher: bots entram no lugar
const TEMPO_VOLTA = +process.env.TEMPO_VOLTA || 90000;
const ACEITA_TODOS = process.env.ACEITA_TODOS_HEROIS === '1' || process.env.FASE_TESTE !== '0';   // fase de teste com amigos (padrão): todos os campeões valem; FASE_TESTE=0 volta a conferir os campeões da conta
const PROTO = 3, BUILD_MINIMO = +process.env.BUILD_MINIMO || 1;   // jogo instalado em versão mais antiga que BUILD_MINIMO precisa atualizar
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const jogadores = new Map();      // ws -> { id, perfil, tok, estado: 'novo'|'ocioso'|'fila'|'partida'|'fim', partida, slot }
const fila = [];                  // jogadores esperando o 1×1
const fila2 = [];                 // jogadores esperando o 2×2
const fila3 = [];                 // jogadores esperando o Trio de Campeões (2 jogadores, cada um com um time de 3)
const fila4 = [];                 // jogadores esperando a Disputa da Coroa (4 jogadores, cada um por si)
const FILAS = { '1v1': fila, '2v2': fila2, trio: fila3, coroa: fila4 };
const TAM = { '1v1': 2, '2v2': 4, trio: 2, coroa: 4 };   // vagas de cada modo
const filaDe = j => FILAS[j.modo] || fila;
const todasFilas = [fila, fila2, fila3, fila4];
const partidas = new Map();       // id -> { id, e, modo, slots: [{ j, perfil, bot, tok }], fase, fim, criada }
const reconectaveis = new Map();  // token -> { p, slot }: quem saiu no meio da luta e pode voltar
const aquecidas = [];             // workers prontos esperando uma partida
const stats = { partidasCriadas: 0, partidasTerminadas: 0, partidasComBot: 0, voltas: 0, tickMedio: 0, ticksTarde: 0, ticks: 0, tickMax: 0, erros: 0, ultimoErro: '' };
let proxId = 1;
const humanos = p => p.slots.filter(s => s.j).map(s => s.j);

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
  else if (m.k === 'fim') { const p = e.p; if (!p || p.fim) return; p.fim = true; stats.partidasTerminadas++; limparReconexoes(p); setTimeout(() => encerrar(p), 20000).unref(); }
  else if (m.k === 'estado') { const p = e.p; if (!p) return; const s = p.slots[m.slot]; if (s && s.j) enviar(s.j.ws, JSON.stringify({ ...p.matchObj(m.slot), t: 'volta', est: m.est })); }
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
  if (slot === -1) { for (const j of humanos(p)) enviar(j.ws, texto); return; }
  const s = p.slots[slot]; if (s && s.j) enviar(s.j.ws, texto);
}
const avisarOutros = (p, slot, obj) => { const t = JSON.stringify(obj); p.slots.forEach((s, i) => { if (i !== slot && s.j) enviar(s.j.ws, t); }); };

/* ---------- jogadores ---------- */
const limpo = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
function perfil(p = {}) {
  return {
    name: limpo(p.name || 'Lutador', 16) || 'Lutador', lv: Math.max(1, Math.min(100, +p.lv || 1)),
    frame: /^[a-z]{2,10}$/.test(p.frame) ? p.frame : 'azul', photo: /^[hs]\d+$/.test(p.photo || '') ? p.photo : 'h0',
    hero: Math.max(0, Math.min(9, Math.floor(+p.hero) || 0)), tier: Math.max(0, Math.min(5, +p.tier || 0)), league: limpo(p.league || 'Bronze', 20),
  };
}
// campeões que o jogador pode usar: se ele tem conta, só os da conta (comprados + grátis da semana); sem conta vale o que ele mandar
function heroiOk(j, h) {
  h = Math.max(0, Math.min(9, Math.floor(+h) || 0));
  if (ACEITA_TODOS || !j.conta) return h;
  const c = contas.porCodigo(j.conta); if (!c) return h;
  const ok = contas.heroisPermitidos(c);
  return ok.has(h) ? h : [...ok][0];
}
const NOMES_BOT = ['Kaito', 'Mira', 'Bruno', 'Luna', 'Tiago', 'Sora', 'Nina', 'Davi', 'Yuki', 'Caio', 'Lara', 'Ravi'];
function perfilBot(ref, usados) {
  let hero = Math.floor(Math.random() * 10);
  for (let k = 0; k < 20 && usados.has(hero); k++) hero = Math.floor(Math.random() * 10);
  usados.add(hero);
  let nome = NOMES_BOT[Math.floor(Math.random() * NOMES_BOT.length)];
  for (let k = 0; k < 30 && usados.has('n:' + nome); k++) nome = NOMES_BOT[Math.floor(Math.random() * NOMES_BOT.length)];
  usados.add('n:' + nome);
  return { name: 'Bot ' + nome, lv: Math.max(1, ref.lv + Math.floor(Math.random() * 3) - 1), frame: 'azul', photo: 'h' + hero, hero, tier: ref.tier, league: ref.league, bot: true };
}
function limparReconexoes(p) { for (const [tok, r] of reconectaveis) if (r.p === p) reconectaveis.delete(tok); }

function sair(j) {
  saiuDoConvite(j);
  if (j.contaId) setImmediate(() => presenca(j.contaId));
  for (const f of todasFilas) { const i = f.indexOf(j); if (i >= 0) f.splice(i, 1); }
  const p = j.partida; j.partida = null; jogadores.delete(j.ws);
  if (!p) return;
  const s = p.slots[j.slot];
  if (p.fim) { if (!humanos(p).some(x => x !== j && x.partida === p)) encerrar(p); return; }
  if (p.fase === 'sel') {   // saiu na sala de escolha: avisa os outros e fecha a partida
    for (const o of humanos(p)) if (o !== j && o.partida === p) enviar(o.ws, JSON.stringify({ t: 'bye' }));
    encerrar(p); return;
  }
  // saiu no meio da luta: um bot assume o campeão dele (e ele pode voltar com o mesmo token)
  if (s && s.j === j) {
    s.j = null; s.bot = true;
    try { p.e.w.postMessage({ k: 'bot', slot: j.slot, on: true }); } catch {}
    if (j.tok) { s.tok = j.tok; reconectaveis.set(j.tok, { p, slot: j.slot }); }
    avisarOutros(p, j.slot, { t: 'bot', s: j.slot, on: 1 });
    log(`partida ${p.id}: ${s.perfil.name} saiu, o bot assume`);
  }
  if (!humanos(p).length) {   // só sobraram bots: espera um tempo para alguém voltar, depois encerra
    clearTimeout(p.timerVazia);
    p.timerVazia = setTimeout(() => { if (!humanos(p).length) encerrar(p); }, TEMPO_VOLTA);
    p.timerVazia.unref?.();
  }
}
function entrarNaFila(j, modo) {
  if (j.partida) { const p = j.partida; j.partida = null; if (p.fim && !humanos(p).some(x => x.partida === p)) encerrar(p); }
  for (const f of todasFilas) { const i = f.indexOf(j); if (i >= 0) f.splice(i, 1); }
  j.modo = FILAS[modo] ? modo : '1v1'; j.time = null; j.filaDesde = Date.now();
  const f = filaDe(j); f.push(j);
  j.estado = 'fila'; if (j.contaId) presenca(j.contaId);
  f.forEach((x, i) => enviar(x.ws, JSON.stringify({ t: 'fila', pos: i + 1, n: f.length, precisa: TAM[j.modo], online: onlineN() })));
  tentarParear();
}
function tentarParear() {
  for (const modoF of Object.keys(FILAS)) {
    const f = FILAS[modoF], tam = TAM[modoF];
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
      criarPartida(modoF === '2v2' ? [grupo[0], grupo[3], grupo[1], grupo[2]] : grupo, modoF);
    }
  }
}
// fila parada há ESPERA_BOT sem encher: bots completam as vagas (os jogadores que esperam ficam juntos, na mesma equipe quando há equipes)
function completarComBots() {
  const agora = Date.now();
  for (const modoF of Object.keys(FILAS)) {
    const f = FILAS[modoF], tam = TAM[modoF];
    if (!f.length || f.length >= tam || partidas.size >= MAX_PARTIDAS) continue;
    if (agora - Math.min(...f.map(x => x.filaDesde || agora)) < ESPERA_BOT) continue;
    const grupo = f.splice(0, tam);
    log(`fila ${modoF}: ${grupo.length} jogador(es) esperando há ${Math.round(ESPERA_BOT / 1000)} s, bots completam`);
    criarPartida(grupo, modoF);
  }
}
setInterval(completarComBots, 1000).unref();

function criarPartida(jog, modo) {
  const id = proxId++, e = aquecidas.shift() || novoWorker(), n = TAM[modo];
  // vagas: os jogadores nas primeiras vagas, bots (IA difícil) nas que faltam
  const usados = new Set(jog.map(j => j.perfil.hero));
  const slots = jog.map(j => ({ j, perfil: j.perfil, bot: false, tok: j.tok || null }));
  while (slots.length < n) slots.push({ j: null, perfil: perfilBot(jog[0].perfil, usados), bot: true, tok: null });
  const ref = slots.findIndex(s => s.bot) >= 0;
  if (ref) stats.partidasComBot++;
  // fase 'sel': os rivais já foram achados e cada um escolhe o campeão (e confirma). Depois vem a fase 'jogo': a thread cria a luta, e ela
  // só começa quando todos terminam de carregar (mensagem 'pronto'); jogos de versão antiga (build < 2) não avisam: contam como prontos
  const p = { id, e, modo, slots, fase: 'sel', fim: false, criada: Date.now(), pronto_sel: slots.map(s => !s.j), prontos: slots.map(s => !s.j || s.j.build < 2), iniciada: false, liberada: false, timerLiberar: null, timerSel: null, timerVazia: null };
  e.p = p; partidas.set(id, p); stats.partidasCriadas++;
  slots.forEach((s, i) => { if (s.j) { s.j.partida = p; s.j.slot = i; s.j.estado = 'partida'; } else if (modo === 'trio') s.time = [...Array(10).keys()].sort(() => Math.random() - .5).slice(0, 3); });
  jog.forEach(x => { if (x.contaId) presenca(x.contaId); });
  const seed = (Math.random() * 4294967296) | 0;
  // o que cada jogador recebe ao começar (e ao voltar): a mesma mensagem 'match'
  p.matchObj = (slot) => {
    const me = slots[slot], hs = slots.map(s => s.perfil.hero), ps = slots.map(s => s.perfil);
    if (modo === '2v2' || modo === 'coroa') return { t: 'match', modo, slot, seed, hs, ps };
    const o = slots[1 - slot];
    if (modo === 'trio') { const teams = slots.map(s => timeDe(s)); return { t: 'match', modo, slot, seed, teams, hh: teams[1 - slot][0], gh: teams[slot][0], them: o.perfil }; }
    return { t: 'match', slot, seed, hh: o.perfil.hero, gh: me.perfil.hero, them: o.perfil };
  };
  p.iniciar = () => {
    slots.forEach((s, i) => { if (s.j) enviar(s.j.ws, JSON.stringify(p.matchObj(i))); });
    const bots = slots.map(s => !s.j), hs = slots.map(s => s.perfil.hero), nomes = slots.map(s => s.perfil.name);
    if (modo === '2v2' || modo === 'coroa') e.w.postMessage({ k: 'iniciar', modo, seed, h: hs, n: nomes, bots });
    else if (modo === 'trio') { const teams = slots.map(s => timeDe(s)); e.w.postMessage({ k: 'iniciar', modo, seed, h0: teams[0][0], h1: teams[1][0], teams, n0: nomes[0], n1: nomes[1], bots }); }
    else e.w.postMessage({ k: 'iniciar', seed, h0: hs[0], h1: hs[1], n0: nomes[0], n1: nomes[1], bots });
    p.iniciada = true; p.timerLiberar = setTimeout(() => liberar(p), 30000); checarLiberar(p);
  };
  log(`partida ${id} (${modo}): ${slots.map(s => s.perfil.name).join(' × ')} (ativas: ${partidas.size})`);
  if (jog.every(j => j.sala)) {
    const ps = slots.map(s => { const { hero, ...resto } = s.perfil; return resto; });   // o campeão do rival só aparece quando a luta começa
    for (const j of jog) enviar(j.ws, JSON.stringify({ t: 'sala', modo, slot: j.slot, ps, ms: TEMPO_SELECAO }));
    p.timerSel = setTimeout(() => comecar(p), TEMPO_SELECAO + 1500);
    if (p.pronto_sel.every(Boolean)) comecar(p);
  } else comecar(p);   // jogo de versão antiga: não conhece a sala de escolha, começa direto com o campeão que mandou
  setImmediate(reporAquecidas);
}
// time de 3 campeões (Trio): o que o jogador escolheu; se faltar, completa com o campeão atual e outros sem repetir
function timeDe(s) {
  const t = Array.isArray(s.time) ? s.time.filter((x, i, v) => Number.isInteger(x) && x >= 0 && x <= 9 && v.indexOf(x) === i).slice(0, 3) : [];
  if (!t.length) t.push(s.perfil.hero);
  for (let h = 0; t.length < 3 && h < 10; h++) if (!t.includes(h)) t.push(h);
  return t;
}
function comecar(p) {
  if (p.fase !== 'sel' || !partidas.has(p.id)) return;
  p.fase = 'jogo'; clearTimeout(p.timerSel);
  if (p.e.pronta) p.iniciar(); else p.e.esperando.push(p.iniciar);
}
function checarLiberar(p) { if (!p.liberada && p.iniciada && p.prontos.every(Boolean)) liberar(p); }
function liberar(p) { if (p.liberada) return; p.liberada = true; clearTimeout(p.timerLiberar); try { p.e.w.postMessage({ k: 'liberar' }); } catch {} }
function encerrar(p) {
  if (!partidas.has(p.id)) return;
  clearTimeout(p.timerLiberar); clearTimeout(p.timerSel); clearTimeout(p.timerVazia); limparReconexoes(p);
  partidas.delete(p.id);
  try { p.e.w.postMessage({ k: 'parar' }); } catch {}
  setTimeout(() => { try { p.e.w.terminate(); } catch {} }, 500).unref();
  for (const j of humanos(p)) if (j.partida === p) { j.partida = null; if (j.estado === 'partida' || j.estado === 'fim') { j.estado = 'ocioso'; if (j.contaId) presenca(j.contaId); } }
}
function encerrarPorErro(e) {
  const p = e.p; if (!p || !partidas.has(p.id)) return;
  for (const j of humanos(p)) enviar(j.ws, JSON.stringify({ t: 'bye' }));
  encerrar(p);
}
// jogador volta para a partida em andamento: o bot sai e a thread manda o estado atual (placar dos rounds, time do Trio...)
function reconectar(j) {
  const r = j.tok && reconectaveis.get(j.tok);
  if (!r || !partidas.has(r.p.id) || r.p.fim || r.p.fase !== 'jogo') { if (j.tok) reconectaveis.delete(j.tok); return enviar(j.ws, JSON.stringify({ t: 'nada' })); }
  const { p, slot } = r, s = p.slots[slot];
  if (!s || s.j) return enviar(j.ws, JSON.stringify({ t: 'nada' }));
  reconectaveis.delete(j.tok); clearTimeout(p.timerVazia);
  s.j = j; s.bot = false; j.partida = p; j.slot = slot; j.estado = 'partida'; j.modo = p.modo; p.prontos[slot] = true;
  stats.voltas++;
  try { p.e.w.postMessage({ k: 'bot', slot, on: false }); p.e.w.postMessage({ k: 'estado', slot }); } catch {}
  avisarOutros(p, slot, { t: 'bot', s: slot, on: 0 });
  log(`partida ${p.id}: ${s.perfil.name} voltou`);
}

/* ---------- amigos, convites e partida entre amigos ---------- */
const onlineN = () => { let n = 0; for (const x of jogadores.values()) if (!x.social) n++; return n; };
function estadoDas() {   // contaId -> 'on' (conectado) | 'jogo' (em fila/partida)
  const m = new Map();
  for (const x of jogadores.values()) {
    if (!x.contaId) continue;
    const ocupado = !x.social && (x.estado === 'fila' || x.estado === 'partida');
    if (ocupado) m.set(x.contaId, 'jogo'); else if (!m.has(x.contaId) && (x.social || x.estado === 'ocioso' || x.estado === 'fim')) m.set(x.contaId, 'on');
  }
  return m;
}
const statusDe = id => estadoDas().get(id) || 'off';
function paraConta(id, obj) { const t = JSON.stringify(obj); for (const x of jogadores.values()) if (x.social && x.contaId === id) enviar(x.ws, t); }
function listaPara(c) {
  const l = contas.lista(c), st = estadoDas();
  const nao = contas.naoLidas(c);
  return { t: 'amigos', cod: l.cod, amigos: l.amigos.map(a => ({ ...a, st: st.get(a.id) || 'off', nao: nao[a.id] || 0 })), recebidos: l.recebidos, enviados: l.enviados };
}
function atualizarLista(...ids) { for (const id of new Set(ids)) { const c = contas.porId(id); if (c) paraConta(id, listaPara(c)); } }
function presenca(id) {   // avisa os amigos conectados que esta conta mudou de estado
  const c = contas.porId(id); if (!c) return; const st = statusDe(id);
  for (const a of (c.amigos || [])) paraConta(a, { t: 'amigo_st', id, st });
}
const convites = new Map();   // cid -> { cid, de, para, modo, estado, lados: Map(contaId -> j), timer }
function fecharConvite(cv, aviso) {
  if (!convites.delete(cv.cid)) return; clearTimeout(cv.timer);
  if (aviso) for (const j of cv.lados.values()) { if (j && j.estado === 'fila' && !j.partida) { j.estado = 'ocioso'; enviar(j.ws, JSON.stringify(aviso)); } }
}
function convidar(j, m) {
  const eu = contas.porId(j.contaId), alvo = contas.porId(String(m.id || ''));
  const resp = o => enviar(j.ws, JSON.stringify({ t: 'convite_res', ...o }));
  const TIPOS_CONVITE = { contra: '1v1', junto: '2v2', trio: 'trio', coroa: 'coroa' };   // duelo 1×1 · equipe 2×2 (juntos) · Trio de Campeões · Disputa da Coroa (bots completam as vagas)
  const tipo = TIPOS_CONVITE[m.tipo] ? m.tipo : null, modo = tipo ? TIPOS_CONVITE[tipo] : null;
  if (!eu || !alvo || !modo || !contas.saoAmigos(eu, alvo.id)) return resp({ st: 'erro', erro: 'amigo' });
  if (partidas.size >= MAX_PARTIDAS) return resp({ st: 'erro', erro: 'cheio' });
  const st = estadoDas();
  if (st.get(eu.id) === 'jogo') return resp({ st: 'erro', erro: 'voce-ocupado' });
  if (!st.has(alvo.id)) return resp({ st: 'erro', erro: 'off', quem: contas.resumo(alvo) });
  if (st.get(alvo.id) === 'jogo') return resp({ st: 'erro', erro: 'ocupado', quem: contas.resumo(alvo) });
  for (const cv of convites.values()) if (cv.de === eu.id && cv.para === alvo.id) fecharConvite(cv);   // novo convite substitui o anterior
  const cid = crypto.randomBytes(5).toString('hex');
  const cv = { cid, de: eu.id, para: alvo.id, modo, estado: 'pendente', lados: new Map() };
  cv.timer = setTimeout(() => { if (cv.estado === 'pendente') { paraConta(cv.de, { t: 'convite_res', cid, st: 'expirou', quem: contas.resumo(alvo) }); paraConta(cv.para, { t: 'convite_fim', cid }); } fecharConvite(cv, { t: 'bye' }); }, 40000);
  cv.timer.unref?.(); convites.set(cid, cv);
  paraConta(alvo.id, { t: 'convite', cid, de: contas.resumo(eu), tipo, modo, ms: 40000 });
  resp({ st: 'enviado', cid, quem: contas.resumo(alvo) });
}
function responderConvite(j, m) {
  const cv = convites.get(String(m.cid || ''));
  if (!cv || cv.para !== j.contaId || cv.estado !== 'pendente') return;
  const eu = contas.porId(j.contaId);
  if (!m.ok) { paraConta(cv.de, { t: 'convite_res', cid: cv.cid, st: m.ocupado ? 'ocupado' : 'recusado', quem: contas.resumo(eu) }); return fecharConvite(cv); }
  cv.estado = 'aceito'; clearTimeout(cv.timer);
  // os dois recebem "ir": cada um abre a conexão de jogo e pede a sala do convite (mensagem 'fila' com cid)
  paraConta(cv.de, { t: 'ir', cid: cv.cid, modo: cv.modo, com: contas.resumo(eu) });
  paraConta(cv.para, { t: 'ir', cid: cv.cid, modo: cv.modo, com: contas.resumo(contas.porId(cv.de)) });
  cv.timer = setTimeout(() => fecharConvite(cv, { t: 'bye' }), 30000); cv.timer.unref?.();
}
function entrarNoConvite(j, m) {   // conexão de jogo de um amigo chegou: quando os dois chegam, a partida é criada (os dois juntos, bots no que faltar)
  const cv = convites.get(String(m.cid || ''));
  if (!cv || cv.estado !== 'aceito' || !j.contaId || (j.contaId !== cv.de && j.contaId !== cv.para) || j.social) return enviar(j.ws, JSON.stringify({ t: 'nada' }));
  if (j.partida && !j.partida.fim) return;
  if (m.p) { j.perfil = perfil(m.p); j.perfil.hero = heroiOk(j, j.perfil.hero); }
  for (const f of todasFilas) { const i = f.indexOf(j); if (i >= 0) f.splice(i, 1); }
  j.modo = cv.modo; j.estado = 'fila'; j.filaDesde = Date.now(); j.convite = cv;
  cv.lados.set(j.contaId, j);
  enviar(j.ws, JSON.stringify({ t: 'fila', pos: 1, n: 1, precisa: TAM[cv.modo], online: onlineN(), amigo: 1 }));
  if (cv.lados.size === 2) {
    const grupo = [cv.lados.get(cv.de), cv.lados.get(cv.para)];
    convites.delete(cv.cid); clearTimeout(cv.timer); grupo.forEach(x => { x.convite = null; });
    criarPartida(grupo, cv.modo);
  }
}
function saiuDoConvite(j) { if (j.convite) { const cv = j.convite; j.convite = null; for (const [id, o] of cv.lados) if (o !== j && o.estado === 'fila' && !o.partida) { o.estado = 'ocioso'; enviar(o.ws, JSON.stringify({ t: 'bye' })); } fecharConvite(cv); } }
function tratarAmigos(j, m) {
  const agora = Date.now(); if (agora - (j.amigoDesde || 0) > 60000) { j.amigoDesde = agora; j.amigoMsgs = 0; }
  if (++j.amigoMsgs > 60) return;
  const c = contas.porId(j.contaId); if (!c) return;
  const res = (t, o) => enviar(j.ws, JSON.stringify({ t, ...o }));
  switch (m.t) {
    case 'amigos': return enviar(j.ws, JSON.stringify(listaPara(c)));
    case 'amigo_add': {
      const r = contas.pedirAmizade(c, m.cod); if (r.erro) return res('amigo_res', { ok: 0, erro: r.erro });
      res('amigo_res', { ok: 1, aceito: !!r.aceito, quem: r.alvo }); atualizarLista(c.id, r.alvo.id);
      if (r.aceito) { presenca(c.id); presenca(r.alvo.id); } return;
    }
    case 'amigo_resp': {
      const r = contas.responderPedido(c, String(m.id || ''), !!m.ok); if (r.erro) return res('amigo_res', { ok: 0, erro: r.erro });
      res('amigo_res', { ok: 1, aceito: !!m.ok, resp: 1, quem: r.outro }); atualizarLista(c.id, r.outro.id); if (m.ok) { presenca(c.id); presenca(r.outro.id); } return;
    }
    case 'amigo_del': { const id = String(m.id || ''); const r = contas.removerAmigo(c, id); res('amigo_res', { ok: r.ok ? 1 : 0, removeu: 1 }); atualizarLista(c.id, id); return; }
    case 'convite': return convidar(j, m);
    case 'convite_resp': return responderConvite(j, m);
    case 'chat_hist': { const r = contas.chatHistorico(c, String(m.id || '')); if (r.erro) return; return res('chat_hist', { id: String(m.id), msgs: r.msgs }); }
    case 'chat_lido': { contas.chatHistorico(c, String(m.id || '')); return; }
    case 'chat': {
      const l = j.chatL = j.chatL && agora - j.chatL.t < 10000 ? j.chatL : { t: agora, n: 0 }; if (++l.n > 8) return res('chat_erro', { erro: 'rapido' });   // no máximo 8 mensagens a cada 10 s
      const r = contas.chatEnviar(c, String(m.id || ''), m.texto); if (r.erro) return res('chat_erro', { erro: r.erro });
      const eu = contas.resumo(c), msg = { t: 'chat_msg', de: c.id, nome: eu.nome, texto: r.m.t, ts: r.m.ts };
      paraConta(c.id, { ...msg, eu: 1, id: String(m.id) });            // aparece também nos outros aparelhos de quem escreveu
      paraConta(String(m.id), msg);                                    // e para o amigo, se estiver online
      return;
    }
  }
}

/* ---------- mensagens dos jogadores ---------- */
function tratar(j, texto) {
  let m; try { m = JSON.parse(texto); } catch { return; }
  if (!m || typeof m.t !== 'string') return;
  if (j.estado === 'novo') {
    if (m.t !== 'hello') return;
    if (m.v !== PROTO) { enviar(j.ws, JSON.stringify({ t: 'erro', m: 'versao' })); return j.ws.close(); }
    if ((+m.build || 1) < BUILD_MINIMO) { enviar(j.ws, JSON.stringify({ t: 'erro', m: 'atualizar', minimo: BUILD_MINIMO })); return j.ws.close(); }
    j.perfil = perfil(m.p); j.conta = typeof m.conta === 'string' && contas.porCodigo(m.conta) ? m.conta : null; j.perfil.hero = heroiOk(j, j.perfil.hero); j.build = +m.build || 1; j.sala = !!m.sala; j.tok = /^[A-Za-z0-9_-]{8,40}$/.test(m.tok || '') ? m.tok : null; j.estado = 'ocioso';
    { const c = j.conta ? contas.porCodigo(j.conta) : null; j.contaId = c ? c.id : null; if (c) contas.atualizarPerfil(c.id, j.perfil); }
    if (m.social) {   // conexão "social": fica aberta para convites e para os amigos verem quem está online (não entra em fila nem em partida)
      if (!j.contaId) { enviar(j.ws, JSON.stringify({ t: 'erro', m: 'conta' })); return j.ws.close(); }
      j.social = true; j.estado = 'social'; j.amigoMsgs = 0; j.amigoDesde = Date.now();
      enviar(j.ws, JSON.stringify({ t: 'hello', social: 1, ok: 1 })); presenca(j.contaId); return;
    }
    return enviar(j.ws, JSON.stringify({ t: 'hello', ok: 1, online: onlineN(), v: PROTO, modos: ['1v1', '2v2', 'trio', 'coroa'], bots: 1, volta: 1 }));
  }
  if (j.social && !['ping', 'perfil', 'amigos', 'amigo_add', 'amigo_resp', 'amigo_del', 'convite', 'convite_resp', 'chat', 'chat_hist', 'chat_lido'].includes(m.t)) return;   // conexão social só fala de amigos
  if (j.contaId && ['amigos', 'amigo_add', 'amigo_resp', 'amigo_del', 'convite', 'convite_resp', 'chat', 'chat_hist', 'chat_lido'].includes(m.t)) return tratarAmigos(j, m);
  switch (m.t) {
    case 'ping': return enviar(j.ws, JSON.stringify({ t: 'pong', at: m.at }));
    case 'perfil': j.perfil = perfil(m.p); j.perfil.hero = heroiOk(j, j.perfil.hero); return;
    case 'fila': if (m.cid) return entrarNoConvite(j, m); if (j.estado === 'fila' || (j.partida && !j.partida.fim)) return; if (m.p) { j.perfil = perfil(m.p); j.perfil.hero = heroiOk(j, j.perfil.hero); } entrarNaFila(j, m.modo); return;
    case 'reconectar': if (j.estado === 'fila' || j.partida) return; return reconectar(j);
    case 'cancelar': { saiuDoConvite(j); for (const f of todasFilas) { const i = f.indexOf(j); if (i >= 0) f.splice(i, 1); } if (j.estado === 'fila') { j.estado = 'ocioso'; if (j.contaId) presenca(j.contaId); } return enviar(j.ws, JSON.stringify({ t: 'ocioso' })); }
    case 'pronto': if (j.partida && !j.partida.fim) { j.partida.prontos[j.slot] = true; checarLiberar(j.partida); } return;
    case 'pick': { const p = j.partida; if (!p || p.fase !== 'sel') return; const s = p.slots[j.slot];
      if (p.modo === 'trio') { s.time = j.time = Array.isArray(m.team) ? m.team.map(x => Math.floor(+x)).filter(x => Number.isInteger(x) && x >= 0 && x <= 9).map(x => heroiOk(j, x)).filter((x, i, v) => v.indexOf(x) === i).slice(0, 3) : null; if (j.time && j.time.length) j.perfil.hero = j.time[0]; p.pronto_sel[j.slot] = false; return; }
      j.perfil.hero = heroiOk(j, m.hero); p.pronto_sel[j.slot] = false;
      if (p.modo === '2v2') { const o = p.slots[j.slot ^ 1]; if (o && o.j) enviar(o.j.ws, JSON.stringify({ t: 'pick', s: j.slot, hero: j.perfil.hero })); } return; }
    case 'ready': { const p = j.partida; if (!p || p.fase !== 'sel') return; p.pronto_sel[j.slot] = !!m.v; avisarOutros(p, j.slot, { t: 'ready', s: j.slot, v: p.pronto_sel[j.slot] ? 1 : 0 }); if (p.pronto_sel.every(Boolean)) comecar(p); return; }
    case 'in': if (j.partida && !j.partida.fim && j.partida.fase === 'jogo') j.partida.e.w.postMessage({ k: 'in', slot: j.slot, m }); return;
    case 'act': if (j.partida && !j.partida.fim && j.partida.fase === 'jogo') j.partida.e.w.postMessage({ k: 'act', slot: j.slot, m }); return;
    case 'teste': if (process.env.TESTE === '1' && j.partida) j.partida.e.w.postMessage({ k: 'teste', m }); return;   // só nos testes
  }
}

/* ---------- http + websocket ---------- */
/* ---------- contas (HTTP) ---------- */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, GET, OPTIONS' };
const limites = new Map();   // ip -> { t, n, c }: máximo de pedidos por minuto e de contas novas por hora
function ipDe(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(); }
function limite(ip, criando) {
  const agora = Date.now(); let l = limites.get(ip); if (!l) { l = { t: agora, n: 0, h: agora, c: 0 }; limites.set(ip, l); }
  if (agora - l.t > 60000) { l.t = agora; l.n = 0; } if (agora - l.h > 3600000) { l.h = agora; l.c = 0; }
  l.n++; if (criando) l.c++;
  return l.n > 60 || (criando && l.c > 12);
}
setInterval(() => { const x = Date.now() - 3600000; for (const [ip, l] of limites) if (l.h < x) limites.delete(ip); }, 600000).unref();
function responder(res, cod, obj) { res.writeHead(cod, { 'content-type': 'application/json', ...CORS }); res.end(JSON.stringify(obj)); }
function rotaConta(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (req.method !== 'POST') return responder(res, 405, { erro: 'metodo' });
  const rota = req.url.split('?')[0], ip = ipDe(req);
  if (limite(ip, rota === '/conta/criar')) return responder(res, 429, { erro: 'muitos' });
  let corpo = '', estourou = false;
  req.on('data', d => { corpo += d; if (corpo.length > 400 * 1024) { estourou = true; req.destroy(); } });
  req.on('end', () => {
    if (estourou) return;
    let m; try { m = JSON.parse(corpo || '{}'); } catch { return responder(res, 400, { erro: 'json' }); }
    if (rota === '/conta/criar') { const r = contas.criar(m.chaves); if (r.erro) return responder(res, r.erro === 'cheio' ? 503 : 400, r); log(`conta criada (${contas.total()} no total)`); return responder(res, 200, r); }
    if (rota === '/conta/entrar') { const r = contas.entrar(m.codigo); return r ? responder(res, 200, r) : responder(res, 404, { erro: 'codigo' }); }
    if (rota === '/conta/salvar') { const r = contas.salvar(m.codigo, m.chaves, m.base); if (r.erro) return responder(res, r.erro === 'codigo' ? 404 : 400, r); return responder(res, r.conflito ? 409 : 200, r); }
    responder(res, 404, { erro: 'rota' });
  });
}
// feedback dos jogadores: POST /feedback/enviar (limite de 6 por minuto) e GET /feedback/ler?k=CHAVE (só quem tem a chave)
function rotaFeedback(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  const [rota, qs] = req.url.split('?');
  if (rota === '/feedback/ler' && req.method === 'GET') {
    const k = new URLSearchParams(qs || '').get('k'), n = Math.max(1, Math.min(500, +new URLSearchParams(qs || '').get('n') || 100));
    if (limite(ipDe(req), false) || !feedback.chaveOk(k)) return responder(res, 403, { erro: 'chave' });
    return responder(res, 200, feedback.listar(n));
  }
  if (rota === '/feedback/enviar' && req.method === 'POST') {
    const ip = ipDe(req);
    const l = limites.get(ip + '#fb') || { t: Date.now(), n: 0 }; if (Date.now() - l.t > 60000) { l.t = Date.now(); l.n = 0; } l.n++; limites.set(ip + '#fb', l);
    if (l.n > 6) return responder(res, 429, { erro: 'muitos' });
    let corpo = '', estourou = false;
    req.on('data', d => { corpo += d; if (corpo.length > 20 * 1024) { estourou = true; req.destroy(); } });
    req.on('end', () => {
      if (estourou) return;
      let m; try { m = JSON.parse(corpo || '{}'); } catch { return responder(res, 400, { erro: 'json' }); }
      const r = feedback.guardar(m, ip); if (r.erro) return responder(res, r.erro === 'vazio' ? 400 : 500, r);
      log(`feedback recebido (${feedback.listar(1).total} no total)`); responder(res, 200, r);
    });
    return;
  }
  responder(res, 404, { erro: 'rota' });
}
const portao = require('./portao.cjs');   // login por cookie + arquivos do jogo (só liga quando SITE está definido; ver portao.cjs)
const servidor = http.createServer((req, res) => {
  if (req.url.startsWith('/conta/')) return rotaConta(req, res);
  if (req.url.startsWith('/feedback/')) return rotaFeedback(req, res);
  const ehSaude = req.url === '/saude' || (req.url === '/' && !portao.ativo);
  if (!ehSaude && portao.tratar(req, res)) return;
  if (ehSaude) {
    const mem = process.memoryUsage();
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    return res.end(JSON.stringify({ ok: true, proto: PROTO, buildMinimo: BUILD_MINIMO, jogadores: jogadores.size, fila: fila.length, fila2: fila2.length, fila3: fila3.length, fila4: fila4.length, contas: contas.total(), partidas: partidas.size, aquecidas: aquecidas.filter(x => x.pronta).length, ...stats, tickMedio: +stats.tickMedio.toFixed(3), tickMax: +stats.tickMax.toFixed(2), memoriaMB: Math.round(mem.rss / 1048576), nucleos: os.cpus().length, uptime: Math.round(process.uptime()) }));
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server: servidor, maxPayload: 4096, perMessageDeflate: false });
wss.on('connection', (ws, req) => {
  if (ORIGENS.length && !ORIGENS.includes(req.headers.origin || '')) return ws.close(1008, 'origem');
  const j = { ws, id: proxId++, perfil: null, tok: null, estado: 'novo', partida: null, slot: 0, msgs: 0, desde: Date.now() };
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
servidor.listen(PORT, () => { log(`chave de leitura do feedback: ${feedback.chave()} (também em ${process.env.DADOS || 'servidor/dados'}/chave-feedback.txt)`); log(`servidor de partidas na porta ${PORT} · protocolo ${PROTO} · ${AQUECIDAS} threads aquecidas · bots após ${Math.round(ESPERA_BOT / 1000)} s`); reporAquecidas(); });
process.on('SIGTERM', () => { log('encerrando'); process.exit(0); });
// um erro inesperado em UMA requisição não pode derrubar o servidor de todo mundo: registra e segue
process.on('uncaughtException', e => { stats.erros++; stats.ultimoErro = String(e && e.message).slice(0, 160); console.error('[erro não tratado]', e && e.stack || e); });
