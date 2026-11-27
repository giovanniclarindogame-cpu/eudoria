// Acessórios online: o servidor usa o item do PERFIL de cada jogador, valida o uso (só 1 vez, só quem tem item) e espelha para o rival.
const { spawn } = require('child_process');const { chromium } = require('playwright');const path=require('path');
const WebSocket=require(path.join(__dirname,'..','servidor','node_modules','ws'));
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8796;
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'2'},stdio:'ignore'});
 for(let i=0;i<40;i++){try{await fetch('http://localhost:'+PORT+'/saude');break}catch{await sleep(250)}}
 const cli=(nome,hero,item)=>new Promise(res=>{const ws=new WebSocket('ws://localhost:'+PORT);const c={ws,nome,msgs:[],snap:null,match:null};
  ws.on('open',()=>{ws.send(JSON.stringify({t:'hello',v:3,p:{name:nome,hero,lv:3,tier:1,league:'Prata',item}}));ws.send(JSON.stringify({t:'fila'}))});
  ws.on('message',d=>{const m=JSON.parse(d);if(m.t==='snap')c.snap=m;else c.msgs.push(m);if(m.t==='match')c.match=m});res(c)});
 const acts=c=>c.msgs.filter(m=>m.t==='act'&&m.f==='itemUse').length;
 try{
  const A=await cli('Ana',2,'pilula'),B=await cli('Beto',4,null);await sleep(5000);
  ok(!!A.match&&!!B.match,'a partida começa');
  ok(B.match.them.item==='pilula'&&A.match.them.item===null,'o servidor guarda o item do perfil de cada jogador e o rival o enxerga ('+B.match.them.item+'/'+A.match.them.item+')');
  const sa=A.match.slot,sb=B.match.slot;
  const hps=[null,null];hps[sa]=500;hps[sb]=500;
  A.ws.send(JSON.stringify({t:'teste',hps}));await sleep(500);
  ok(A.snap.g.hp===500&&B.snap.g.hp===500,'(preparo) os dois jogadores com 500 de vida');
  // A usa a Pílula dos Deuses
  A.ws.send(JSON.stringify({t:'act',f:'itemUse',a:0,x:0,y:0,args:[0]}));await sleep(500);
  ok(Math.round(A.snap.g.hp)>=745&&Math.round(A.snap.g.hp)<=760,'o servidor aplica a cura do item ('+A.snap.g.hp+')');
  ok(Math.round(B.snap.h.hp)>=745,'o rival vê a vida do jogador subir ('+B.snap.h.hp+')');
  ok(acts(B)===1,'o uso do item é espelhado para o rival ('+acts(B)+' ação)');
  // uso repetido (consumível já gasto): recusado, sem espelhar
  A.ws.send(JSON.stringify({t:'act',f:'itemUse',a:0,x:0,y:0,args:[0]}));await sleep(400);
  ok(acts(B)===1,'usar de novo o consumível é recusado (não é espelhado)');
  // B não tem item e tenta usar o índice da pílula: recusado
  const antes=Math.round(B.snap.g.hp);
  B.ws.send(JSON.stringify({t:'act',f:'itemUse',a:0,x:0,y:0,args:[0]}));await sleep(500);
  ok(acts(A)===0&&Math.round(B.snap.g.hp)<=antes+1,'quem não tem item não consegue usar um (nem escolhendo o índice) ('+antes+' → '+Math.round(B.snap.g.hp)+')');
  A.ws.close();B.ws.close();await sleep(500);
  // id inventado no perfil é descartado
  const C=await cli('Caio',1,'hack_item'),D=await cli('Duda',3,'tronco');await sleep(5000);
  ok(D.match&&D.match.them.item===null&&C.match.them.item==='tronco','id de item inventado é descartado pelo servidor e o válido passa ('+(D.match?.them.item)+'/'+(C.match?.them.item)+')');
  C.ws.close();D.ws.close();await sleep(500);
  /* ---------- dois navegadores reais ---------- */
  const br=await chromium.launch();const errs=[];
  async function jogador(nome,hero,item){
   const pg=await (await br.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true})).newPage();pg.on('pageerror',e=>errs.push(nome+': '+e.message));
   await pg.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
   await pg.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent('ws://localhost:'+PORT));await pg.waitForTimeout(900);
   await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',nome);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);
   await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
   await pg.evaluate(([h,i])=>{equipChampion(h,false);if(i)ItensV85.equipar(h,i)},[hero,item]);return pg}
  const PA=await jogador('Ana',2,'pilula'),PB=await jogador('Beto',5,null);
  for(const pg of [PA,PB]){await pg.evaluate(()=>OnlineV45.procurar('1v1'));await sleep(300)}
  for(const pg of [PA,PB])await pg.waitForFunction(()=>window.OnlineV46?.match.on&&state==='fight',null,{timeout:60000});
  await sleep(1200);
  ok(await PA.evaluate(()=>p.item&&p.item.id==='pilula')&&await PB.evaluate(()=>!p.item),'no navegador, cada jogador tem o seu item (ou nenhum)');
  ok(await PA.evaluate(()=>{const e=document.getElementById('itemBtn85');return !!e&&!e.hidden})&&await PB.evaluate(()=>document.getElementById('itemBtn85')?.hidden!==false),'só quem tem item vê o botão ITEM');
  // baixa a vida da Ana no servidor e ela toca no botão
  await PA.evaluate(()=>{const s=OnlineV46.match.slot;const hps=[null,null];hps[s]=500;OnlineV45.send({t:'teste',hps})});await sleep(700);
  await PA.evaluate(()=>{document.getElementById('itemBtn85').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}))});await sleep(1200);
  const hA=await PA.evaluate(()=>Math.round(p.hp)),hB=await PB.evaluate(()=>Math.round(b.hp));
  ok(hA>=740&&hA<=765,'tocar no botão cura no servidor e a Ana vê a vida subir ('+hA+')');
  ok(hB>=740&&hB<=765,'o Beto vê a vida da Ana subir ('+hB+')');
  ok(await PA.evaluate(()=>/usado/.test(document.getElementById('itemBtn85').className)),'o botão da Ana mostra USADO');
  ok(errs.length===0,'nenhum erro de JavaScript nos navegadores '+errs.slice(0,2));
  await br.close();
 }finally{sv.kill()}
})();
