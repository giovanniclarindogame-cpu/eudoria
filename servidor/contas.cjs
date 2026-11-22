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
let contas = {}, porHash = new Map(), sujo = false, timer = null;

function carregar() {
  try { fs.mkdirSync(DIR, { recursive: true }); } catch {}
  try { const d = JSON.parse(fs.readFileSync(ARQ, 'utf8')); contas = d.contas || {}; } catch { contas = {}; }
  porHash = new Map(Object.values(contas).map(c => [c.hash, c.id]));
}
function gravar() {
  sujo = false;
  try { const tmp = ARQ + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ versao: 1, contas })); fs.renameSync(tmp, ARQ); } catch (e) { console.error('[contas] erro ao gravar', e.message); }
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

carregar();
module.exports = { criar, entrar, salvar, porCodigo, heroisPermitidos, livresDaSemana, normaliza, CHAVES, total: () => Object.keys(contas).length, gravar };
