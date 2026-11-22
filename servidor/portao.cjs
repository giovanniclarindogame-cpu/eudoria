'use strict';
/*
 * Portão do jogo (v67): login por usuário e senha (cookie) e entrega dos arquivos do jogo (index.html, css/, js/, assets/).
 *
 * Por que não "senha do navegador" (Basic Auth)? Em alguns celulares o navegador pede usuário e senha DE NOVO no meio da partida
 * (a conexão do jogo ou uma imagem chega sem a senha). Com a página de login e um cookie isso não acontece, e o cookie vale 30 dias.
 *
 * Variáveis:
 *   SITE     pasta com index.html, css/, js/, assets/ (vazio = portão DESLIGADO: o servidor só cuida das partidas, como antes)
 *   ACESSOS  arquivo com os amigos (uma linha por amigo: "nome scrypt:SAL:HASH"). Pode mudar com o servidor ligado.
 *   DADOS    pasta de dados (segredo dos cookies e registro de acessos)
 *
 * Gerenciar amigos:  node amigos.cjs add NOME [NOME2 ...] | remover NOME | lista | quem   (ver amigos.sh)
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const SITE = process.env.SITE ? path.resolve(process.env.SITE) : '';
const ARQ = process.env.ACESSOS || '';
const DADOS = process.env.DADOS || path.join(__dirname, 'dados');
const DIAS = 30, LOG = path.join(DADOS, 'acessos.log');
const ativo = !!SITE;

/* ---------- amigos e senhas ---------- */
const NOME_OK = /^[A-Za-z0-9_-]{2,30}$/;
function criarHash(senha) {
  const sal = crypto.randomBytes(16);
  return 'scrypt:' + sal.toString('hex') + ':' + crypto.scryptSync(String(senha), sal, 32).toString('hex');
}
function confere(senha, reg) {
  const [t, salHex, hashHex] = String(reg || '').split(':');
  if (t !== 'scrypt' || !/^[0-9a-f]{32}$/.test(salHex || '') || !/^[0-9a-f]{64}$/.test(hashHex || '')) return false;
  const h = crypto.scryptSync(String(senha), Buffer.from(salHex, 'hex'), 32), ref = Buffer.from(hashHex, 'hex');
  return h.length === ref.length && crypto.timingSafeEqual(h, ref);
}
let cacheUsu = { m: -1, tam: -1, mapa: new Map() };
function amigos() {   // nome -> registro (relê o arquivo só quando ele muda)
  if (!ARQ) return cacheUsu.mapa;
  let st; try { st = fs.statSync(ARQ); } catch { cacheUsu = { m: -1, tam: -1, mapa: new Map() }; return cacheUsu.mapa; }
  if (st.mtimeMs === cacheUsu.m && st.size === cacheUsu.tam) return cacheUsu.mapa;
  const mapa = new Map();
  let txt = '';
  try { txt = fs.readFileSync(ARQ, 'utf8'); }
  catch (e) {   // sem permissão para ler (arquivo criado por outro usuário): NUNCA derruba o servidor; ninguém entra até arrumar a permissão
    if (!cacheUsu.avisou) { console.error(`[portão] não consegui ler ${ARQ} (${e.code}). Arrume com: chmod 666 acessos/usuarios.txt`); }
    cacheUsu = { m: -1, tam: -1, mapa, avisou: true }; return mapa;
  }
  for (const l of txt.split('\n')) {
    const [nome, reg] = l.trim().split(/\s+/);
    if (nome && NOME_OK.test(nome) && /^scrypt:/.test(reg || '')) mapa.set(nome, reg);   // outras linhas (formato antigo) são ignoradas
  }
  cacheUsu = { m: st.mtimeMs, tam: st.size, mapa, avisou: false };
  return mapa;
}
function gravarAmigos(mapa) {
  const txt = [...mapa].map(([n, r]) => n + ' ' + r).join('\n') + (mapa.size ? '\n' : '');
  fs.writeFileSync(ARQ, txt, { mode: 0o666 });
  cacheUsu = { m: -1, tam: -1, mapa: new Map() };
}

/* ---------- cookie assinado ---------- */
let segredo = null;
function chave() {
  if (segredo) return segredo;
  const f = path.join(DADOS, 'portao-segredo.txt');
  try { segredo = fs.readFileSync(f, 'utf8').trim(); } catch {}
  if (!segredo || segredo.length < 32) {
    segredo = crypto.randomBytes(32).toString('hex');
    try { fs.mkdirSync(DADOS, { recursive: true }); fs.writeFileSync(f, segredo + '\n', { mode: 0o600 }); } catch {}
  }
  return segredo;
}
const b64 = s => Buffer.from(s).toString('base64url');
const assinar = dado => crypto.createHmac('sha256', chave()).update(dado).digest('base64url');
function criarCookie(usuario) {
  const dado = b64(JSON.stringify({ u: usuario, e: Date.now() + DIAS * 864e5 }));
  return dado + '.' + assinar(dado);
}
function usuarioDoCookie(req) {
  const m = /(?:^|;\s*)eldoria_s=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [dado, ass] = m[1].split('.');
  if (!dado || !ass) return null;
  const esperado = assinar(dado);
  if (ass.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(ass), Buffer.from(esperado))) return null;
  let o; try { o = JSON.parse(Buffer.from(dado, 'base64url').toString()); } catch { return null; }
  if (!o || !o.u || !(o.e > Date.now()) || !amigos().has(o.u)) return null;   // amigo removido = acesso cortado na hora
  return o.u;
}

/* ---------- registro de acessos ---------- */
const ipDe = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
function registrar(tipo, usuario, req, extra) {
  try { fs.mkdirSync(DADOS, { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ t: Date.now(), tipo, u: usuario || null, ip: ipDe(req), ua: String(req.headers['user-agent'] || '').slice(0, 120), ...extra }) + '\n'); } catch {}
}

/* ---------- tentativas de senha ---------- */
const erros = new Map();   // ip -> { n, t }
function bloqueado(ip) { const e = erros.get(ip); return !!e && Date.now() - e.t < 600000 && e.n >= 8; }
function errou(ip) { const e = erros.get(ip); if (!e || Date.now() - e.t >= 600000) erros.set(ip, { n: 1, t: Date.now() }); else { e.n++; e.t = Date.now(); } }
setInterval(() => { const x = Date.now() - 600000; for (const [ip, e] of erros) if (e.t < x) erros.delete(ip); }, 300000).unref();

/* ---------- página de login ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function paginaLogin(msg, next) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>Eldoria · Entrar</title>
<style>*{box-sizing:border-box}html,body{margin:0;min-height:100%}body{display:grid;place-items:center;min-height:100vh;min-height:100dvh;padding:16px;background:radial-gradient(circle at 50% 20%,#3f66d8,#162a6b 70%);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff}
form{width:min(380px,100%);padding:22px 20px;border:3px solid #ffd34d;border-radius:22px;background:linear-gradient(180deg,#2a4fb8,#1b3487);box-shadow:0 8px 0 #8a5a00,0 18px 40px #0008}
h1{margin:0 0 4px;font:900 26px/1.1 system-ui;letter-spacing:1px;color:#ffe066;text-shadow:0 3px 0 #0006;text-align:center}p{margin:0 0 14px;text-align:center;color:#dbe7ff;font-weight:600;font-size:14px}
label{display:block;margin:10px 0 4px;font-weight:800;font-size:13px;color:#ffe9a8}input{width:100%;padding:12px 14px;border:2px solid #fff3c2;border-radius:12px;background:#fff8e1;color:#3b2506;font:700 17px system-ui}
button{width:100%;margin-top:16px;padding:13px;border:2px solid #fff3c2;border-radius:14px;background:linear-gradient(180deg,#ffe066,#f5b800);color:#4a2a00;font:900 18px system-ui;box-shadow:0 4px 0 #8a5a00;cursor:pointer}button:active{transform:translateY(3px);box-shadow:0 1px 0 #8a5a00}
.e{margin:12px 0 0;padding:9px 12px;border-radius:10px;background:#7a1020;border:2px solid #ff8a98;text-align:center;font-weight:800;font-size:14px}small{display:block;margin-top:14px;text-align:center;color:#b8c9f5}</style></head>
<body><form method="post" action="/entrar"><h1>ELDORIA</h1><p>Arena dos Campeões · versão de teste</p>
<label for="u">Usuário</label><input id="u" name="u" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required autofocus>
<label for="s">Senha</label><input id="s" name="s" type="password" autocomplete="current-password" required>
<input type="hidden" name="next" value="${esc(next || '/')}">${msg ? `<div class="e" role="alert">${esc(msg)}</div>` : ''}
<button type="submit">Entrar</button><small>Acesso só para convidados.</small></form></body></html>`;
}
const proxima = n => (typeof n === 'string' && /^\/(?!\/)[^\s\\]*$/.test(n) && !n.startsWith('/entrar')) ? n : '/';
function lerCorpo(req, cb) {
  let c = '', fim = false;
  req.on('data', d => { c += d; if (c.length > 2048 && !fim) { fim = true; req.destroy(); } });
  req.on('end', () => { if (!fim) cb(c); });
}
function login(req, res) {
  const ip = ipDe(req), seguro = String(req.headers['x-forwarded-proto'] || '') === 'https' || !!req.socket.encrypted;
  lerCorpo(req, corpo => {
    const f = new URLSearchParams(corpo), u = String(f.get('u') || '').trim(), s = String(f.get('s') || ''), next = proxima(f.get('next'));
    const nega = (cod, msg) => { res.writeHead(cod, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(paginaLogin(msg, next)); };
    if (bloqueado(ip)) return nega(429, 'Muitas tentativas. Espere alguns minutos e tente de novo.');
    const reg = amigos().get(u);
    // confere sempre (mesmo se o usuário não existe) para o tempo de resposta não revelar quem tem acesso
    const certo = confere(s, reg || criarHash('x'));
    if (!reg || !certo) { errou(ip); registrar('login-falhou', NOME_OK.test(u) ? u : null, req); return nega(401, 'Usuário ou senha incorretos.'); }
    erros.delete(ip); registrar('login', u, req);
    res.writeHead(303, { location: next, 'set-cookie': `eldoria_s=${criarCookie(u)}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; SameSite=Lax${seguro ? '; Secure' : ''}`, 'cache-control': 'no-store' });
    res.end();
  });
}

/* ---------- arquivos do jogo ---------- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4' };
const PERMITIDO = /^\/(index\.html$|assets\/|css\/|js\/)/;   // nunca entrega servidor/, tests/, scripts/, .git, documentos
function caminho(url) {
  let p; try { p = decodeURIComponent(String(url).split('?')[0].split('#')[0]); } catch { return null; }
  if (p.includes('\0') || p.includes('\\')) return null;
  if (p === '/') p = '/index.html';
  p = path.posix.normalize(p);
  if (!p.startsWith('/') || p.split('/').some(seg => seg === '..' || (seg.startsWith('.') && seg.length > 0))) return null;
  if (!PERMITIDO.test(p)) return null;
  const f = path.join(SITE, p);
  return f.startsWith(SITE + path.sep) ? { f, p } : null;
}
function entregar(req, res, usuario) {
  const c = caminho(req.url);
  if (!c) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Não encontrado'); }
  fs.stat(c.f, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Não encontrado'); }
    const ext = path.extname(c.f).toLowerCase(), etag = `W/"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    const html = ext === '.html';
    const h = { 'content-type': TIPOS[ext] || 'application/octet-stream', etag, 'x-content-type-options': 'nosniff', 'cache-control': html ? 'private, no-cache' : 'private, max-age=86400', 'last-modified': st.mtime.toUTCString() };
    if (html) registrar('pagina', usuario, req, { p: c.p });
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    h['content-length'] = st.size;
    res.writeHead(200, h);
    if (req.method === 'HEAD') return res.end();
    const rs = fs.createReadStream(c.f);
    rs.on('error', () => res.destroy());
    res.on('close', () => rs.destroy());
    rs.pipe(res);
  });
}

/* ---------- entrada: devolve true quando o portão tratou o pedido ---------- */
function tratar(req, res) {
  if (!ativo) return false;
  const rota = String(req.url).split('?')[0];
  if (rota === '/entrar') {
    if (req.method === 'POST') { login(req, res); return true; }
    if (req.method === 'GET' || req.method === 'HEAD') {
      const next = proxima(new URLSearchParams(String(req.url).split('?')[1] || '').get('next'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : paginaLogin('', next)); return true;
    }
    res.writeHead(405); res.end(); return true;
  }
  if (rota === '/sair') {
    res.writeHead(303, { location: '/entrar', 'set-cookie': 'eldoria_s=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax', 'cache-control': 'no-store' }); res.end(); return true;
  }
  if (rota === '/robots.txt') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('User-agent: *\nDisallow: /\n'); return true; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }); res.end(); return true; }
  const usuario = usuarioDoCookie(req);
  if (!usuario) {
    const doc = /text\/html/.test(req.headers.accept || '') || req.headers['sec-fetch-dest'] === 'document';
    if (doc) { res.writeHead(303, { location: '/entrar?next=' + encodeURIComponent(proxima(String(req.url))), 'cache-control': 'no-store' }); res.end(); }
    else { res.writeHead(401, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }); res.end('Entre primeiro em /entrar'); }
    return true;
  }
  entregar(req, res, usuario);
  return true;
}

/* ---------- ferramentas para o amigos.cjs ---------- */
function resumoAcessos() {   // por amigo: páginas abertas, logins, último acesso, IPs
  const r = {};
  let txt = ''; try { txt = fs.readFileSync(LOG, 'utf8'); } catch {}
  for (const l of txt.split('\n')) {
    let j; try { j = JSON.parse(l); } catch { continue; }
    if (!j.u) continue;
    const x = r[j.u] = r[j.u] || { paginas: 0, logins: 0, ultimo: 0, ips: new Set() };
    if (j.tipo === 'pagina') x.paginas++; if (j.tipo === 'login') x.logins++;
    x.ultimo = Math.max(x.ultimo, j.t); if (j.ip) x.ips.add(j.ip);
  }
  return r;
}
module.exports = { ativo, tratar, amigos, gravarAmigos, criarHash, confere, resumoAcessos, NOME_OK, ARQ, usuarioDoCookie, criarCookie };
