'use strict';
/*
 * Feedback dos jogadores (fase de teste): o jogo manda tipo, texto, nota (1 a 5) e um pouco de contexto (versão, tela, modo, aparelho, últimos erros).
 *  - Guarda em DADOS/feedback.jsonl (uma linha por mensagem). O endereço de internet do jogador não é guardado, só um hash curto (para contar quantas pessoas escreveram).
 *  - Quem lê usa a CHAVE de leitura (variável FEEDBACK_CHAVE, ou a que o servidor cria em DADOS/chave-feedback.txt): GET /feedback/ler?k=CHAVE
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = process.env.DADOS || path.join(__dirname, 'dados');
const ARQ = path.join(DIR, 'feedback.jsonl'), ARQ_CHAVE = path.join(DIR, 'chave-feedback.txt'), DIR_CAP = path.join(DIR, 'capturas');
const TIPOS = ['bug', 'ideia', 'elogio', 'outro'];
try { fs.mkdirSync(DIR, { recursive: true }); fs.mkdirSync(DIR_CAP, { recursive: true }); } catch {}
let chave = (process.env.FEEDBACK_CHAVE || '').trim();
if (!chave) {
  try { chave = fs.readFileSync(ARQ_CHAVE, 'utf8').trim(); } catch {}
  if (!chave) { chave = crypto.randomBytes(12).toString('hex'); try { fs.writeFileSync(ARQ_CHAVE, chave + '\n'); } catch {} }
}
const txt = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
function guardar(m, ip) {
  const texto = txt(m.texto, 800);
  if (texto.length < 3) return { erro: 'vazio' };
  const ctx = {};
  if (m.ctx && typeof m.ctx === 'object') for (const k of Object.keys(m.ctx).slice(0, 20)) { const v = m.ctx[k]; ctx[txt(k, 24)] = Array.isArray(v) ? v.slice(0, 5).map(x => txt(x, 200)) : txt(v, 200); }
  const item = {
    id: crypto.randomBytes(4).toString('hex'), t: Date.now(),
    tipo: TIPOS.includes(m.tipo) ? m.tipo : 'outro', nota: Math.max(0, Math.min(5, Math.floor(+m.nota) || 0)), texto, ctx,
    pessoa: crypto.createHash('sha256').update(String(ip || '')).digest('hex').slice(0, 6),
  };
  // relatório da partida (botão "Reportar bug" na luta): texto JSON de até 8000 caracteres + uma captura da arena (JPEG pequeno)
  if (m.relatorio != null) { try { item.relatorio = typeof m.relatorio === 'string' ? m.relatorio.slice(0, 8000) : JSON.stringify(m.relatorio).slice(0, 8000); } catch {} }
  if (typeof m.captura === 'string' && m.captura.length < 140000) {
    const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(m.captura);
    if (mm) { try { const buf = Buffer.from(mm[1], 'base64'); if (buf.length > 200 && buf.length < 100000 && buf[0] === 0xff && buf[1] === 0xd8) { fs.writeFileSync(path.join(DIR_CAP, item.id + '.jpg'), buf); item.captura = item.id; } } catch {} }
  }
  try { fs.appendFileSync(ARQ, JSON.stringify(item) + '\n'); } catch (e) { return { erro: 'disco' }; }
  return { ok: true, id: item.id };
}
function listar(n = 100) {
  let linhas = [];
  try { linhas = fs.readFileSync(ARQ, 'utf8').split('\n').filter(Boolean); } catch {}
  const itens = linhas.slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse()
    .map(i => ({ ...i, quando: new Date(i.t).toISOString().replace('T', ' ').slice(0, 16) }));
  return { total: linhas.length, itens };
}
const chaveOk = k => typeof k === 'string' && k.length >= 8 && crypto.timingSafeEqual(Buffer.from(k.padEnd(64).slice(0, 64)), Buffer.from(chave.padEnd(64).slice(0, 64))) && k === chave;
const lerCaptura = id => { if (!/^[0-9a-f]{8}$/.test(String(id))) return null; try { return fs.readFileSync(path.join(DIR_CAP, id + '.jpg')); } catch { return null; } };
module.exports = { guardar, listar, lerCaptura, chaveOk, chave: () => chave, TIPOS };
