'use strict';
/*
 * Contas do Eldoria: conta anônima com CÓDIGO DE RECUPERAÇÃO (sem e-mail nem senha).
 *  - O código (16 letras/números, ex. K7QM-2XPA-9WDT-H4NC) é a chave da conta: quem o tem entra na conta em qualquer aparelho. O servidor guarda só o
 *    hash (SHA-256) do código; o código aparece uma vez, na criação, e o jogo o guarda no aparelho.
 *  - Cada conta guarda o "pacote" de progresso do jogo (as chaves do localStorage que contam: moedas, campeões, nível, missões...). A cada gravação
 *    a versão sobe; quem grava precisa informar a versão que tinha ("base"): se outro aparelho gravou antes, volta 409 com os dados mais novos.
 *  - Os campeões liberados da conta (comprados + os 3 grátis da semana) valem nas partidas: o servidor confere o herói escolhido.
 * Arquivo: DADOS/contas.json (variável DADOS; no Docker é o volume /dados). Gravação atômica (arquivo temporário + rename) e agrupada.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = process.env.DADOS || path.join(__dirname, 'dados');
const ARQ = path.join(DIR, 'contas.json');
const CHAVES = ['eldoria-champions-v1', 'eldoria.retencao.v1', 'eldoria.cacada.v1', 'eldoria.arcade.v1', 'eldoria-lobby-v18', 'ecos-loadout'];
const MAX_CHAVE = 120 * 1024, MAX_TOTAL = 300 * 1024, MAX_CONTAS = +process.env.MAX_CONTAS || 20000;
const ALFA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // sem I, L, O, 0 e 1 (não se confundem ao digitar)
let contas = {}, chats = {}, porHash = new Map(), porCod = new Map(), sujo = false, timer = null;   // chats: "idA:idB" -> [{de,t,ts}]   // porCod: código de amigo -> id

function carregar() {
  try { fs.mkdirSync(DIR, { recursive: true }); } catch {}
  try { const d = JSON.parse(fs.readFileSync(ARQ, 'utf8')); contas = d.contas || {}; chats = d.chats || {}; } catch { contas = {}; chats = {}; }
  porHash = new Map(Object.values(contas).map(c => [c.hash, c.id]));
  porCod = new Map(Object.values(contas).filter(c => c.cod).map(c => [c.cod, c.id]));
}
function gravar() {
  sujo = false;
  try { const tmp = ARQ + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ versao: 1, contas, chats })); fs.renameSync(tmp, ARQ); } catch (e) { console.error('[contas] erro ao gravar', e.message); }
}
function agendar() { sujo = true; if (!timer) timer = setTimeout(() => { timer = null; if (sujo) gravar(); }, 1500); timer.unref?.(); }
function sair() { if (timer) { clearTimeout(timer); timer = null; } if (sujo) gravar(); }
process.on('exit', sair); process.on('SIGTERM', () => { sair(); });

const normaliza = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const hash = codigo => crypto.createHash('sha256').update(normaliza(codigo)).digest('hex');
function novoCodigo() {
  const b = crypto.randomBytes(16); let s = '';
  for (let i = 0; i < 16; i++) s += ALFA[b[i] % ALFA.length];
  return s.replace(/(.{4})(?=.)/g, '$1-');
}
function limpaChaves(chaves) {
  if (!chaves || typeof chaves !== 'object') return null;
  const out = {}; let total = 0;
  for (const k of CHAVES) { const v = chaves[k]; if (typeof v !== 'string') continue; if (v.length > MAX_CHAVE) return null; total += v.length; out[k] = v; }
  if (total > MAX_TOTAL) return null;
  return out;
}
function nomeDe(chaves) { try { return String(JSON.parse(chaves['eldoria-champions-v1']).profile.name || '').slice(0, 16); } catch { return ''; } }

function criar(chaves) {
  const ch = limpaChaves(chaves); if (!ch) return { erro: 'pacote' };
  if (Object.keys(contas).length >= MAX_CONTAS) return { erro: 'cheio' };
  let codigo, h; do { codigo = novoCodigo(); h = hash(codigo); } while (porHash.has(h));
  const id = crypto.randomBytes(6).toString('hex'), agora = Date.now();
  contas[id] = { id, hash: h, criada: agora, atualizada: agora, acesso: agora, versao: 1, nome: nomeDe(ch), chaves: ch };
  porHash.set(h, id); agendar();
  return { codigo, id, versao: 1 };
}
const porCodigo = codigo => { const id = porHash.get(hash(codigo)); return id ? contas[id] : null; };
function entrar(codigo) {
  const c = porCodigo(codigo); if (!c) return null;
  c.acesso = Date.now(); agendar();
  return { id: c.id, versao: c.versao, chaves: c.chaves, nome: c.nome };
}
function salvar(codigo, chaves, base) {
  const c = porCodigo(codigo); if (!c) return { erro: 'codigo' };
  const ch = limpaChaves(chaves); if (!ch) return { erro: 'pacote' };
  if (+base !== c.versao) return { conflito: true, versao: c.versao, chaves: c.chaves };
  const igual = CHAVES.every(k => (ch[k] || '') === (c.chaves[k] || ''));
  if (!igual) { c.chaves = ch; c.versao++; c.atualizada = Date.now(); c.nome = nomeDe(ch); }
  c.acesso = Date.now(); agendar();
  return { ok: true, versao: c.versao };
}

/* ---------- campeões liberados ---------- */
// mesma conta de js/jogo.js (rodízio semanal: 3 campeões grátis por semana, a partir de segunda-feira)
function semana(now) { const d = new Date(now); const dias = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); return Math.floor((dias + 3) / 7); }
function livresDaSemana(now) {
  let a = (semana(now) * 2654435761) >>> 0;
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let k = ids.length - 1; k > 0; k--) { const r = Math.floor(rnd() * (k + 1)); [ids[k], ids[r]] = [ids[r], ids[k]]; }
  return ids.slice(0, 3);
}
// conjunto de heróis que a conta pode usar agora (os comprados + os grátis da semana; perto da virada da semana vale a semana vizinha também,
// porque o relógio do aparelho pode diferir do do servidor)
function heroisPermitidos(c, now = Date.now()) {
  const s = new Set();
  try { const o = JSON.parse(c.chaves['eldoria-champions-v1']).ownedHeroes; if (Array.isArray(o)) for (const h of o) if (Number.isInteger(h) && h >= 0 && h <= 9) s.add(h); } catch {}
  for (const t of [now - 864e5, now, now + 864e5]) for (const h of livresDaSemana(t)) s.add(h);
  return s;
}


/* ---------- amigos ---------- */
// Cada conta tem um CÓDIGO DE AMIGO público (6 letras/números, ex. K7QM2X): dá para passar para os outros. É diferente do código de recuperação
// (que é secreto). Pedido de amizade: quem recebe aceita ou recusa. Amigos são mútuos.
const MAX_AMIGOS = 60, MAX_PEDIDOS = 30;
const porId = id => contas[id] || null;
function codAmigo(c) {
  if (c.cod) return c.cod;
  let x; do { const b = crypto.randomBytes(6); x = ''; for (let i = 0; i < 6; i++) x += ALFA[b[i] % ALFA.length]; } while (porCod.has(x));
  c.cod = x; porCod.set(x, c.id); agendar(); return x;
}
const normCod = s => String(s || '').toUpperCase().split('').filter(ch => ALFA.includes(ch)).join('');
function garantirListas(c) { c.amigos = c.amigos || []; c.recebidos = c.recebidos || []; c.enviados = c.enviados || []; }
function atualizarPerfil(id, p) {
  const c = porId(id); if (!c || !p) return;
  const novo = { name: String(p.name || '').slice(0, 16), lv: p.lv | 0, photo: String(p.photo || 'h0'), frame: String(p.frame || 'azul') };
  if (!c.perfil || c.perfil.name !== novo.name || c.perfil.lv !== novo.lv || c.perfil.photo !== novo.photo || c.perfil.frame !== novo.frame) { c.perfil = novo; agendar(); }
}
const resumo = c => ({ id: c.id, nome: (c.perfil && c.perfil.name) || c.nome || 'Lutador', lv: (c.perfil && c.perfil.lv) || 1, photo: (c.perfil && c.perfil.photo) || 'h0', frame: (c.perfil && c.perfil.frame) || 'azul' });
function lista(c) {
  garantirListas(c);
  const mapa = ids => ids.map(porId).filter(Boolean).map(resumo);
  return { cod: codAmigo(c), amigos: mapa(c.amigos), recebidos: mapa(c.recebidos), enviados: mapa(c.enviados) };
}
const saoAmigos = (a, bId) => { garantirListas(a); return a.amigos.includes(bId); };
function ligar(a, b) { for (const [x, y] of [[a, b], [b, a]]) { garantirListas(x); if (!x.amigos.includes(y.id)) x.amigos.push(y.id); x.recebidos = x.recebidos.filter(i => i !== y.id); x.enviados = x.enviados.filter(i => i !== y.id); } agendar(); }
function pedirAmizade(c, cod) {
  garantirListas(c);
  const alvoId = porCod.get(normCod(cod)), alvo = alvoId && porId(alvoId);
  if (!alvo) return { erro: 'cod' };
  if (alvo.id === c.id) return { erro: 'proprio' };
  garantirListas(alvo);
  if (c.amigos.includes(alvo.id)) return { erro: 'ja' };
  if (c.recebidos.includes(alvo.id)) { ligar(c, alvo); return { ok: true, aceito: true, alvo: resumo(alvo) }; }   // ele já tinha pedido: vira amizade na hora
  if (c.enviados.includes(alvo.id)) return { erro: 'pedido' };
  if (c.amigos.length >= MAX_AMIGOS || c.enviados.length >= MAX_PEDIDOS || alvo.recebidos.length >= MAX_PEDIDOS || alvo.amigos.length >= MAX_AMIGOS) return { erro: 'limite' };
  c.enviados.push(alvo.id); alvo.recebidos.push(c.id); agendar();
  return { ok: true, alvo: resumo(alvo) };
}
function responderPedido(c, id, aceita) {
  garantirListas(c);
  const o = porId(id); if (!o || !c.recebidos.includes(id)) return { erro: 'nada' };
  if (aceita) { if (c.amigos.length >= MAX_AMIGOS) return { erro: 'limite' }; ligar(c, o); }
  else { garantirListas(o); c.recebidos = c.recebidos.filter(i => i !== id); o.enviados = o.enviados.filter(i => i !== c.id); agendar(); }
  return { ok: true, outro: resumo(o) };
}
function removerAmigo(c, id) {   // remove amizade ou cancela um pedido enviado
  garantirListas(c); const o = porId(id); if (!o) return { erro: 'nada' }; garantirListas(o);
  c.amigos = c.amigos.filter(i => i !== id); o.amigos = o.amigos.filter(i => i !== c.id);
  c.enviados = c.enviados.filter(i => i !== id); o.recebidos = o.recebidos.filter(i => i !== c.id);
  delete chats[chave(c.id, id)]; agendar(); return { ok: true };
}

/* ---------- chat entre amigos ---------- */
// Mensagens ficam guardadas no servidor (as últimas 60 de cada dupla) para chegarem mesmo com o amigo offline. "lidas": quando cada um leu a conversa.
const CHAT_MAX = 60, CHAT_TEXTO = 200;
const chave = (a, b) => (a < b ? a + ':' + b : b + ':' + a);
const limpaTexto = t => String(t ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_TEXTO);
function chatEnviar(c, idAmigo, texto) {
  const o = porId(idAmigo); if (!o || !saoAmigos(c, o.id)) return { erro: 'amigo' };
  const t = limpaTexto(texto); if (!t) return { erro: 'vazio' };
  const k = chave(c.id, o.id), l = chats[k] = chats[k] || [];
  const m = { de: c.id, t, ts: Date.now() };
  l.push(m); if (l.length > CHAT_MAX) l.splice(0, l.length - CHAT_MAX);
  c.lidas = c.lidas || {}; c.lidas[o.id] = m.ts;   // quem escreve já leu a conversa
  agendar(); return { ok: true, m, outro: resumo(o) };
}
function chatHistorico(c, idAmigo, marcarLida = true) {
  const o = porId(idAmigo); if (!o || !saoAmigos(c, o.id)) return { erro: 'amigo' };
  const l = chats[chave(c.id, o.id)] || [];
  if (marcarLida) { c.lidas = c.lidas || {}; c.lidas[o.id] = Date.now(); agendar(); }
  return { ok: true, msgs: l.map(m => ({ eu: m.de === c.id, t: m.t, ts: m.ts })) };
}
function naoLidas(c) {   // amigo -> quantidade de mensagens dele que ainda não li
  const r = {}; garantirListas(c);
  for (const id of c.amigos) {
    const l = chats[chave(c.id, id)]; if (!l || !l.length) continue;
    const lida = (c.lidas && c.lidas[id]) || 0; const n = l.filter(m => m.de === id && m.ts > lida).length; if (n) r[id] = n;
  }
  return r;
}

carregar();
module.exports = { chatEnviar, chatHistorico, naoLidas, porId, codAmigo, atualizarPerfil, lista, saoAmigos, pedirAmizade, responderPedido, removerAmigo, resumo, criar, entrar, salvar, porCodigo, heroisPermitidos, livresDaSemana, normaliza, CHAVES, total: () => Object.keys(contas).length, gravar };
