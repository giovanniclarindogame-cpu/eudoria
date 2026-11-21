'use strict';
// Thread de UMA partida: carrega o jogo sem tela, espera os jogadores ("pronta") e roda a luta a 30 ticks por segundo.
// Fala com o servidor principal por mensagens: { k:'pronta' | 'send' | 'fim' | 'stats' | 'erro' }.
const { parentPort } = require('worker_threads');
const { performance } = require('perf_hooks');
const fs = require('fs'), path = require('path');
const { load } = require('./carregador.cjs');
const HOST = fs.readFileSync(path.join(__dirname, 'anfitriao.js'), 'utf8');
const DT = 1 / 30, PERIODO = 1000 / 30;
let g = null, w = null, timer = null, rodando = false, over = false;
const st = { ticks: 0, tarde: 0, soma: 0, max: 0 };

async function preparar() {
  g = await load('?allheroes=1', { pular: ['js/online_v45.js', 'js/online_luta_v46.js'] });
  w = g.dom.window;
  w.__net = (slot, texto) => parentPort.postMessage({ k: 'send', slot, m: texto });
  g.ev(`document.querySelector('#welcomeEnter')?.click();document.querySelector('#profileName').value='Servidor';
        document.querySelector('#profileForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
        try{RetQA.set({tutorial:true})}catch{};draw=function(){};`);
  await new Promise(r => setTimeout(r, 150));
  w.eval(HOST);
  parentPort.postMessage({ k: 'pronta', erros: g.errs.length });
}

function laco(proximo) {
  if (!rodando) return;
  const agora = performance.now();
  let n = 0;
  while (proximo <= agora && n < 3) {
    const t0 = performance.now();
    try { w.__SRV.tick(DT); } catch (e) { parentPort.postMessage({ k: 'erro', m: String(e && e.message).slice(0, 160) }); }
    const ms = performance.now() - t0;
    st.ticks++; st.soma += ms; if (ms > st.max) st.max = ms; if (ms > PERIODO) st.tarde++;
    proximo += PERIODO; n++;
    if (!over && w.__SRV.over) { over = true; parentPort.postMessage({ k: 'fim' }); }
  }
  if (proximo < agora - 200) proximo = agora;   // ficou muito para trás: não tenta recuperar
  timer = setTimeout(() => laco(proximo), Math.max(1, proximo - performance.now()));
}

parentPort.on('message', (msg) => {
  try {
    if (msg.k === 'iniciar') {
      const r = w.__SRV.start({ seed: msg.seed, h0: msg.h0, h1: msg.h1, n0: msg.n0, n1: msg.n1 });
      rodando = true; laco(performance.now());
      setInterval(() => {
        parentPort.postMessage({ k: 'stats', ticks: st.ticks, tarde: st.tarde, media: st.ticks ? st.soma / st.ticks : 0, max: st.max, acoes: w.__SRV.acts, recusadas: w.__SRV.rejected });
        st.ticks = 0; st.tarde = 0; st.soma = 0; st.max = 0;
      }, 5000).unref();
    } else if (msg.k === 'in') w.__SRV.input(msg.slot, msg.m);
    else if (msg.k === 'act') w.__SRV.act(msg.slot, msg.m);
    else if (msg.k === 'teste' && process.env.TESTE === '1') w.__SRV.debug(msg.m);
    else if (msg.k === 'parar') { rodando = false; clearTimeout(timer); try { w.close(); } catch {} parentPort.postMessage({ k: 'parou' }); }
  } catch (e) { parentPort.postMessage({ k: 'erro', m: String(e && e.message).slice(0, 160) }); }
});
preparar().catch(e => parentPort.postMessage({ k: 'erro', m: 'preparar: ' + String(e && e.message).slice(0, 160) }));
