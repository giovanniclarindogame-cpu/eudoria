'use strict';
/*
 * Modo manutenção: lê manutencao.json (o mesmo arquivo que a página do jogo consulta). Com "ativo": true o servidor NÃO aceita partidas novas
 * (fila, convites, revanche), mas deixa as que estão em andamento terminarem e aceita reconexão a elas.
 * Onde procura o arquivo: MANUTENCAO_ARQ, ou $SITE/manutencao.json (no Docker, a pasta do jogo), ou ../manutencao.json (rodando direto).
 * Relê no máximo a cada 3 s e só quando o arquivo mudou. Arquivo ausente ou com defeito = manutenção DESLIGADA (nunca trava o jogo).
 */
const fs = require('fs'), path = require('path');
const ARQ = process.env.MANUTENCAO_ARQ || (process.env.SITE ? path.join(process.env.SITE, 'manutencao.json') : path.join(__dirname, '..', 'manutencao.json'));
let cache = { ativo: false, mensagem: '', volta: '' }, mtime = -1, checado = 0;
function estado() {
  const agora = Date.now();
  if (agora - checado < 3000) return cache;
  checado = agora;
  try {
    const st = fs.statSync(ARQ);
    if (st.mtimeMs !== mtime) {
      mtime = st.mtimeMs;
      const d = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
      cache = { ativo: d && d.ativo === true, mensagem: String((d && d.mensagem) || '').slice(0, 200), volta: String((d && d.volta) || '').slice(0, 60) };
    }
  } catch { cache = { ativo: false, mensagem: '', volta: '' }; mtime = -1; }
  return cache;
}
module.exports = { estado, ativo: () => estado().ativo, ARQ };
