// Ao clicar em JOGAR (online), a arte do campeão é baixada antes, com a tela de carregamento; só depois a busca começa.
// Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.route(/assets\/(reforged_v10|astral_v1\d|corpos_v24|sprites)\//,async r=>{await new Promise(x=>setTimeout(x,2500));r.continue()});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.__ws=[];window.WebSocket=class{constructor(u){window.__ws.push(u);this.readyState=0}send(){}close(){}addEventListener(){}}});
 await p.goto('http://localhost:8000/index.html?teste=1');await p.waitForTimeout(900);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
 const antes=await p.evaluate(()=>({precisa:Carregamento.precisa([account.profile.skin]),servidor:!!window.ELDORIA_SERVIDOR}));
 ok(antes.servidor,'há servidor configurado');
 ok(antes.precisa,'a arte do campeão ainda não foi baixada ao abrir (carga sob demanda)');
 await p.evaluate(()=>{window.__r=OnlineV45.procurar('1v1')});await p.waitForTimeout(400);
 const meio=await p.evaluate(()=>({tela:!document.querySelector('#carregandoV51').hidden,ws:window.__ws.length,proc:OnlineV45.state.procurando,msg:document.querySelector('.c51-msg')?.textContent,titulo:document.querySelector('#carregandoV51 header b')?.textContent}));
 ok(meio.tela&&meio.ws===0&&!meio.proc,`ao clicar: tela de carregamento aparece e a busca ainda não começou (${meio.titulo} · ${meio.msg})`);
 await p.waitForFunction(()=>window.__ws.length>0,null,{timeout:40000});
 const fim=await p.evaluate(()=>({ws:window.__ws.length,proc:OnlineV45.state.procurando,pronto:!Carregamento.precisa([account.profile.skin])}));
 ok(fim.ws===1&&fim.proc,'terminou de baixar: a busca por rivais começou');
 ok(fim.pronto,'a arte do campeão ficou pronta e aquecida');
 await p.waitForFunction(()=>document.querySelector('#carregandoV51').hidden,null,{timeout:4000}).catch(()=>{});
 ok(await p.evaluate(()=>document.querySelector('#carregandoV51').hidden),'a tela de carregamento some');
 // 2ª vez: já pronto, não mostra tela e começa na hora
 await p.evaluate(()=>{OnlineV45.cancelar();window.__ws.length=0;window.__r=OnlineV45.procurar('1v1')});
 ok(await p.evaluate(()=>window.__ws.length===1&&document.querySelector('#carregandoV51').hidden),'2ª vez: sem tela e a busca começa na hora');
 ok(errs.length===0,'sem erros de JavaScript '+errs.join('|'));
 await b.close();
})();
