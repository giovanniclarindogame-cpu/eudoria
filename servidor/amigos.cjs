'use strict';
// Gerencia os amigos que podem abrir o jogo (roda dentro do servidor; use o amigos.sh na VPS).
//   node amigos.cjs add NOME [NOME2 ...]   cria os acessos e MOSTRA cada senha uma única vez
//   node amigos.cjs remover NOME           corta o acesso (vale na hora, o amigo é desconectado do jogo na próxima página)
//   node amigos.cjs lista                  nomes com acesso
//   node amigos.cjs quem                   quem abriu o jogo: páginas, último acesso e IPs
const fs = require('fs'), crypto = require('crypto');
const P = require('./portao.cjs');
if (!P.ARQ) { console.error('Falta a variável ACESSOS (arquivo dos amigos).'); process.exit(2); }
try { fs.mkdirSync(require('path').dirname(P.ARQ), { recursive: true }); if (!fs.existsSync(P.ARQ)) fs.writeFileSync(P.ARQ, '', { mode: 0o666 }); } catch {}
const [cmd, ...args] = process.argv.slice(2);
const mapa = new Map(P.amigos());
if (cmd === 'add') {
  if (!args.length) { console.error('Uso: add NOME [NOME2 ...]'); process.exit(1); }
  let novos = 0;
  for (const n of args) {
    if (!P.NOME_OK.test(n)) { console.log(`Nome inválido '${n}' (2 a 30 letras/números, sem espaço ou acento): pulei`); continue; }
    if (mapa.has(n)) { console.log(`Já existe '${n}': pulei. (Para trocar a senha: remover ${n} e depois add ${n})`); continue; }
    const senha = crypto.randomBytes(5).toString('hex');   // 10 caracteres
    mapa.set(n, P.criarHash(senha)); novos++;
    console.log(`usuário: ${n}\nsenha:   ${senha}\n`);
  }
  if (novos) P.gravarAmigos(mapa);
  console.log(`Criados: ${novos}. Anote as senhas acima: não dá para ver de novo.`);
} else if (cmd === 'remover') {
  const n = args[0];
  if (!n || !mapa.has(n)) { console.log(`Não existe '${n || ''}'.`); process.exit(1); }
  mapa.delete(n); P.gravarAmigos(mapa); console.log(`Acesso de ${n} removido (vale na hora).`);
} else if (cmd === 'lista') {
  console.log([...mapa.keys()].join('\n') || '(ninguém tem acesso ainda)');
} else if (cmd === 'quem') {
  const r = P.resumoAcessos(), nomes = [...new Set([...mapa.keys(), ...Object.keys(r)])];
  for (const n of nomes) {
    const x = r[n];
    console.log(n.padEnd(14), mapa.has(n) ? '        ' : '(removido)', x ? `${String(x.paginas).padStart(4)} aberturas  último: ${new Date(x.ultimo).toLocaleString('pt-BR')}  IPs: ${[...x.ips].join(', ')}` : '   nunca entrou');
  }
} else {
  console.log('Uso: node amigos.cjs add NOME... | remover NOME | lista | quem');
}
