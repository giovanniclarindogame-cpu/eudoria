// Tela de carregamento (v51): aparece na primeira luta com campeões novos, prepara só os dois, some sozinha, não aparece na repetição,
// não cobre lutas que começam direto, e ?semcarga=1 desliga.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const br=await chromium.launch();const errs=[];
 async function nova(q=''){const pg=await (await br.newContext({viewport:{width:844,height:390},hasTouch:true})).newPage();pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8000/index.html?allheroes=1'+q);await pg.waitForTimeout(900);await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Carga');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForSelector('.v40-home',{timeout:30000});await pg.waitForTimeout(1200);await pg.evaluate(()=>{document.querySelector('#ljModal')?.remove();try{RetQA.set({tutorial:true})}catch{}});return pg}
 const pg=await nova();
 const ao_abrir=await pg.evaluate(()=>({criadas:LazyArt.criadas,iniciadas:LazyArt.iniciadas,pre:Object.keys(PRECARGA).length}));
 ok(ao_abrir.iniciadas<10&&ao_abrir.criadas>200&&ao_abrir.pre===10,`ao abrir quase nenhuma arte de herói é baixada (${ao_abrir.iniciadas} de ${ao_abrir.criadas}) e a lista de pré-carga tem os 10 campeões`);
 // 1ª luta: Eclipse × Corsário
 await pg.evaluate(()=>{equipChampion(4,false);lobbyPrefs.mode='1v1';queueMatch('1v1');V3Modes.swapHero(b,7,1000)});
 const seg=await pg.evaluate(()=>({estado:state,tela:!!document.querySelector('#carregandoV51:not([hidden])'),cont:getComputedStyle(document.querySelector('#countdown')).display}));
 ok(seg.estado==='loading'&&seg.cont==='none','logo depois de começar, a luta fica parada (state=loading) e sem contagem');
 await pg.waitForFunction(()=>!!document.querySelector('#carregandoV51:not([hidden])'),null,{timeout:5000}).catch(()=>{});
 ok(await pg.evaluate(()=>{const t=document.querySelector('#carregandoV51');return t&&!t.hidden&&/PREPARANDO/.test(t.textContent)&&t.querySelectorAll('.c51-side').length===2&&/Eclipse/.test(t.textContent)&&/Corsário/.test(t.textContent)}),'a tela mostra os dois campeões (Eclipse × Corsário) e o título');
 await pg.waitForFunction(()=>state==='count'||state==='fight',null,{timeout:60000});
 const u=await pg.evaluate(()=>({ult:Carregamento.ultima,morno:[...Carregamento.morno].sort(),ini:LazyArt.iniciadas}));
 ok(u.ult.ids.sort().join()==='4,7'&&u.ult.imagens>=15&&u.morno.join()==='4,7',`preparou só os dois campeões (${u.ult.imagens} artes; mornos: ${u.morno})`);
 ok(u.ini>=u.ult.imagens&&u.ini<80,`só as artes dos dois foram baixadas (${u.ini} de ${await pg.evaluate(()=>LazyArt.criadas)})`);
 await pg.waitForFunction(()=>document.querySelector('#carregandoV51').hidden,null,{timeout:5000}).catch(()=>{});
 ok(await pg.evaluate(()=>document.querySelector('#carregandoV51').hidden&&!document.body.classList.contains('c51-on')),'a tela some sozinha');
 await pg.waitForFunction(()=>state==='fight',null,{timeout:20000});
 ok(await pg.evaluate(()=>p.skin===4&&b.skin===7),'a luta começa com os campeões certos');
 // repetição com os mesmos campeões: sem tela
 await pg.evaluate(()=>{try{leave()}catch{};equipChampion(4,false);lobbyPrefs.mode='1v1';queueMatch('1v1');V3Modes.swapHero(b,7,1000);window.__viu=false;const o=new MutationObserver(()=>{if(!document.querySelector('#carregandoV51').hidden)window.__viu=true});o.observe(document.querySelector('#carregandoV51'),{attributes:true})});
 await pg.waitForFunction(()=>state==='count'||state==='fight',null,{timeout:10000});await sleep(300);
 ok(await pg.evaluate(()=>!window.__viu&&Carregamento.ultima.rapido),'repetir a luta com os mesmos campeões não mostra a tela (já está tudo pronto)');
 // luta que força o estado logo depois de começar: nada de tela por cima
 await pg.evaluate(()=>{try{leave()}catch{};equipChampion(1,false);lobbyPrefs.mode='1v1';queueMatch('1v1');V3Modes.swapHero(b,2,1000);state='fight';window.__viu2=false;const o=new MutationObserver(()=>{if(!document.querySelector('#carregandoV51').hidden)window.__viu2=true});o.observe(document.querySelector('#carregandoV51'),{attributes:true})});
 await sleep(2500);
 ok(await pg.evaluate(()=>!window.__viu2&&state==='fight'),'luta que começa direto em "fight" não ganha tela de carregamento por cima');
 // falha de rede numa arte não trava a luta
 const pg2=await nova();await pg2.route('**/assets/cavaleiro_v37/**',r=>r.abort());
 await pg2.evaluate(()=>{equipChampion(8,false);lobbyPrefs.mode='1v1';queueMatch('1v1');V3Modes.swapHero(b,8,1000)});
 await pg2.waitForFunction(()=>state==='fight',null,{timeout:60000});
 ok(true,'se as artes de um campeão falham ao baixar, a luta começa assim mesmo');
 // ?semcarga=1 desliga
 const pg3=await nova('&semcarga=1');
 await pg3.evaluate(()=>{equipChampion(3,false);lobbyPrefs.mode='1v1';queueMatch('1v1');V3Modes.swapHero(b,5,1000)});
 ok(await pg3.evaluate(()=>state==='count'&&document.querySelector('#carregandoV51')===null),'?semcarga=1 desliga a tela (a luta vai direto para a contagem)');
 ok(!errs.length,'sem erros de JavaScript '+errs.slice(0,3).join(' | '));
 await br.close();process.exit(process.exitCode||0);
})();
