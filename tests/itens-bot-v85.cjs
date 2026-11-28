// Bots e itens: o item é SORTEADO, o jogo decide quando usar (cada item tem a sua regra) e, online, o servidor faz o bot usar e todos veem.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');
const WebSocket=require(path.join(__dirname,'..','servidor','node_modules','ws'));
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true})).newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);

 /* ---------- sorteio ---------- */
 const S=await p.evaluate(()=>{const c={};for(let i=0;i<1800;i++){const id=ItensV85.sorteia();c[id]=(c[id]||0)+1}return c});
 const ids=Object.keys(S);
 ok(ids.length===18&&Math.max(...Object.values(S))<1800*.12,'o sorteio alcança os 18 itens, sem favorecer nenhum ('+ids.length+' itens; maior fatia '+Math.round(Math.max(...Object.values(S))/18)+'‰)');

 /* ---------- duelo contra bot: o rival leva um item sorteado; no Treino, não ---------- */
 await p.evaluate(()=>{matchMode='1v1';battleActivity='casual';account.activeChampion=0;selected=[...CHAMPIONS[0].kit];start()});
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(1200);
 const D=await p.evaluate(()=>({item:b.item&&b.item.id,valido:!!(b.item&&ItensV85.BY[b.item.id]),meu:p.item&&p.item.id}));
 ok(D.valido,'o bot do duelo entra com um item sorteado ('+D.item+')');
 await p.evaluate(()=>{matchMode='1v1';battleActivity='training';start()});
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(1200);
 ok(await p.evaluate(()=>!b.item),'no Treino o boneco não usa item');

 /* ---------- cada item tem uma regra de uso pelo bot ---------- */
 await p.evaluate(()=>{matchMode='1v1';battleActivity='casual';start()});
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(800);
 const CASOS={
  pilula:{hp:300},doce:{hp:450},carne:{d:340,hp:350},sangue:{d:160,hp:700},escudo:{d:260,agindo:1},chapeu:{d:180,hp:600},tronco:{d:140,hp:400},
  cantil:{root:2},pesos:{d:420},mascara:{d:200,hp:900,php:600},caderno:{d:300},kon:{d:240,hp:500},carta:{d:200,agindo:1},
  venda:{cds:2},chakra:{cds:3},relogio:{d:300,hp:400},licenca:{reativo:'licenca'},brasa:{reativo:'brasa'}};
 const R=await p.evaluate(async(CASOS)=>{
  const out={};
  const steps=sec=>{for(let i=0;i<Math.round(sec*60);i++){if(state!=='fight')break;step(1/60)}};
  for(const [id,c] of Object.entries(CASOS)){
   try{
   ItensV85.equip(p,null);ItensV85.equip(b,id);
   p.hp=p.max=1000;b.hp=b.max=1000;p.x=300;p.y=300;b.x=300+(c.d||200);b.y=300;p.cast=0;p.inv=999;b.inv=0;b.root=0;b.slow=0;b.cd.fill(0);
   if(c.hp)b.hp=c.hp;if(c.php)p.hp=c.php;if(c.root)b.root=c.root;
   if(c.cds)for(let i=0;i<c.cds;i++)b.cd[b.kit[i]]=9;
   if(c.cds===3)b.cd[b.kit[2]]=9;
   let usou=false;if(!b.item){out[id]='sem item após equip';continue}
   if(c.reativo==='licenca'){b.hp=30;hit(b,900,p,0,0);out[id]=b.hp>0&&b.item.used;continue}
   if(c.reativo==='brasa'){b.hp=250;steps(.3);out[id]=!b.item.armed;continue}
   for(let t=0;t<4&&!usou;t+=.25){
    if(c.agindo)p.cast=1;steps(.25);p.x=300;p.y=300;
    if(!b.item){out[id]='item sumiu (estado '+state+')';break}
    if(c.hp&&b.item.def.cat!=='cura'){b.hp=Math.min(b.hp,c.hp)}   // a vida do bot é mantida para a situação continuar valendo
    usou=!!(b.item.used||b.item.cd>0);
   }
   if(id==='kon')usou=usou&&b.skin===b.itemFor&&!b.itemDecoy;   // a isca do bot não pode virar o "rival" do jogador (variável b)
   out[id]=usou||('NÃO: cd='+b.item.cd+' used='+b.item.used+' hp='+Math.round(b.hp)+' dist='+Math.round(Math.hypot(b.x-p.x,b.y-p.y))+' estado='+state+' des='+ItensV85.botDesejo(b));
   }catch(e){out[id]='ERRO '+e.message+' estado='+state+' skin='+b.skin+' itemFor='+b.itemFor+' item='+(b.item&&b.item.id)+' modeRun='+!!modeRun}
  }
  return out},CASOS);
 console.log('BOT-REGRAS',JSON.stringify(R));
 for(const [id,v] of Object.entries(R))ok(v,`o bot usa ${id} quando a situação pede`);
 // sem situação, não gasta à toa
 const Q=await p.evaluate(()=>{ItensV85.equip(b,'pilula');b.hp=b.max=1000;p.hp=p.max=1000;p.inv=999;p.x=300;p.y=300;b.x=520;b.y=300;for(let i=0;i<240;i++){if(state!=='fight')break;step(1/60);b.hp=b.max}return b.item.used});
 ok(Q===false,'com a vida cheia o bot guarda a Pílula dos Deuses');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await b.close();

 /* ---------- servidor: bot usa o item e os jogadores veem ---------- */
 const PORT=8795;
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1',ESPERA_BOT:'400'},stdio:'ignore'});
 for(let i=0;i<40;i++){try{await fetch('http://localhost:'+PORT+'/saude');break}catch{await sleep(250)}}
 try{
  const ws=new WebSocket('ws://localhost:'+PORT),msgs=[];let snap=null,match=null;
  ws.on('message',d=>{const m=JSON.parse(d);if(m.t==='snap')snap=m;else{msgs.push(m);if(m.t==='match')match=m}});
  await new Promise(r=>ws.on('open',r));
  ws.send(JSON.stringify({t:'hello',v:3,p:{name:'Ana',hero:2,lv:3,tier:1,league:'Prata'}}));ws.send(JSON.stringify({t:'fila'}));
  for(let i=0;i<60&&!match;i++)await sleep(250);
  await sleep(2500);
  const ID=require(path.join(__dirname,'..','servidor','itens.cjs'));
  ok(!!match&&ID.includes(match.them.item),'o servidor dá ao bot um item sorteado, e o jogador o enxerga ('+(match&&match.them.item)+')');
  const sb=1-match.slot,sa=match.slot,hps=[null,null];hps[sb]=200;
  ws.send(JSON.stringify({t:'teste',hps,item:[sb,'pilula']}));
  await sleep(3500);
  const uso=msgs.filter(m=>m.t==='act'&&m.f==='itemUse'&&m.s===sb);
  ok(uso.length===1,'o bot usa o item e a ação chega para o jogador ('+uso.length+')');
  ok(snap&&snap.h.hp>=340,'o bot curou no servidor (200 → '+(snap&&Math.round(snap.h.hp))+')');
  ws.close();
 }finally{sv.kill()}
})();
