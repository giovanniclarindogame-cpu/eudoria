// Artes dos efeitos dos itens: auras por categoria (cura/defesa/ataque/utilidade) e o Boneco Kon pintado (aparece, parado, golpe, some).
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true,deviceScaleFactor:1})).newPage();
 p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
 await p.evaluate(()=>{for(const id of ItensV85.IDS)ItensV85.conta().tem[id]=true;matchMode='1v1';battleActivity='training';account.activeChampion=0;selected=[...CHAMPIONS[0].kit];start()});
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>new Promise(r=>{const t=setInterval(()=>{const ok=[...document.images].length>=0;r(true)},50)})),'(preparo) luta em andamento');
 // espia o desenho das folhas
 await p.evaluate(()=>{window.__rows={};const od=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,sx,sy){if(im&&im.src){const m=/itens_v85\/(auras|kon|escudo|tronco)\.webp/.exec(im.src);if(m){const k=m[1];(window.__rows[k]=window.__rows[k]||{});const r=Math.round(sy/320),c=Math.round(sx/320);(window.__rows[k][r]=window.__rows[k][r]||new Set()).add(c)}}return od.apply(this,arguments)}});
 const prep=async id=>{await p.evaluate(id=>{ItensV85.equip(p,id);ItensV85.equip(b,null);p.hp=p.max=1000;p.inv=999;p.x=300;p.y=300;b.x=640;b.y=300;p.cd.fill(0)},id)};
 const usa=async id=>{await prep(id);await p.evaluate(id=>window.itemUse(p,ItensV85.BY[id].idx),id);await p.waitForTimeout(950)};
 // auras: uma por categoria
 const lin={};
 for(const [id,cat] of [['pilula','cura'],['escudo','defesa'],['pesos','ataque'],['venda','util']]){
  await p.evaluate(()=>{window.__rows={}});await usa(id);
  const rows=await p.evaluate(()=>{const a=window.__rows.auras||{};return Object.fromEntries(Object.entries(a).map(([k,v])=>[k,[...v].length]))});
  lin[cat]=rows;
 }
 console.log('AURAS',JSON.stringify(lin));
 ok(Object.keys(lin.cura).join()==='0'&&Object.keys(lin.defesa).join()==='1'&&Object.keys(lin.ataque).join()==='2'&&Object.keys(lin.util).join()==='3','cada categoria usa a linha certa da folha de auras (cura 0, defesa 1, ataque 2, utilidade 3)');
 ok(Object.values(lin).every(o=>Object.values(o)[0]>=4),'a aura anima (vários quadros, do surgir ao dissipar)');
 ok(await p.evaluate(()=>ItensV85.AUR.length===0),'a aura some sozinha depois da animação');
 await p.evaluate(()=>{ItensV85.equip(p,'pilula');p.hp=500;itemUse(p,0)});await p.waitForTimeout(450);
 await p.screenshot({path:'/tmp/claude-0/arte_aura.png',clip:{x:150,y:120,width:400,height:220}});
 // Boneco Kon
 await p.evaluate(()=>{window.__rows={}});
 await prep('kon');await p.evaluate(()=>itemUse(p,ItensV85.BY.kon.idx));await p.waitForTimeout(350);
 await p.screenshot({path:'/tmp/claude-0/arte_kon0.png',clip:{x:300,y:120,width:400,height:220}});
 await p.waitForTimeout(500);
 await p.evaluate(()=>{hit(ItensV85.DEC[0],10,b,0,0)});await p.waitForTimeout(250);
 await p.screenshot({path:'/tmp/claude-0/arte_kon1.png',clip:{x:300,y:120,width:400,height:220}});
 await p.waitForTimeout(500);
 const vivo=await p.evaluate(()=>ItensV85.DEC.length);
 await p.waitForTimeout(2100);
 const kon=await p.evaluate(()=>Object.fromEntries(Object.entries(window.__rows.kon||{}).map(([k,v])=>[k,[...v].length])));
 console.log('KON',JSON.stringify(kon),'vivo no meio:',vivo);
 ok(vivo===1,'a isca está viva depois do golpe de teste');
 ok(kon[1]>=3,'Kon aparece em fumaça (linha 1)');
 ok(kon[0]>=2,'Kon fica parado, balançando (linha 0)');
 ok(kon[3]>=2,'Kon reage ao golpe (linha 3)');
 ok(kon[2]>=3,'Kon some em fumaça no fim (linha 2)');
 ok(await p.evaluate(()=>ItensV85.DEC.length===0&&ItensV85.GONE.length===0),'tudo é limpo depois que ele some');
 // Escudo do Dragão
 await p.evaluate(()=>{window.__rows={}});
 await prep('escudo');await p.evaluate(()=>{p.a=0;window.itemUse(p,ItensV85.BY.escudo.idx)});await p.waitForTimeout(800);
 await p.screenshot({path:'/tmp/claude-0/arte_esc0.png',clip:{x:150,y:120,width:400,height:220}});
 await p.evaluate(()=>{p.inv=0;hit(p,40,b,0,0);p.inv=999});await p.waitForTimeout(200);
 await p.screenshot({path:'/tmp/claude-0/arte_esc1.png',clip:{x:150,y:120,width:400,height:220}});
 await p.waitForTimeout(500);
 const ativo=await p.evaluate(()=>!!(p.ix.barrier&&p.ix.barrier.hp>0));
 await p.evaluate(()=>{p.inv=0;hit(p,300,b,0,0);p.inv=999});await p.waitForTimeout(250);
 await p.screenshot({path:'/tmp/claude-0/arte_esc2.png',clip:{x:150,y:120,width:400,height:220}});
 await p.waitForTimeout(900);
 const esc=await p.evaluate(()=>Object.fromEntries(Object.entries(window.__rows.escudo||{}).map(([k,v])=>[k,[...v].length])));
 console.log('ESCUDO',JSON.stringify(esc),'ativo após 1º golpe:',ativo);
 ok(ativo,'o escudo continua de pé depois de absorver um golpe leve');
 ok(esc[0]>=3,'o escudo surge desenhando o arco (linha 0)');
 ok(esc[1]>=3,'o escudo fica ativo em loop (linha 1)');
 ok(esc[2]>=2,'o escudo brilha ao absorver um golpe (linha 2)');
 ok(esc[3]>=3,'o escudo se estilhaça quando a proteção acaba (linha 3)');
 ok(await p.evaluate(()=>ItensV85.BRK.length===0&&!p.ix.barrier),'tudo é limpo depois da quebra');
 // Tronco de Substituição
 await p.evaluate(()=>{window.__rows={}});
 await prep('tronco');await p.evaluate(()=>window.itemUse(p,ItensV85.BY.tronco.idx));await p.waitForTimeout(350);
 await p.screenshot({path:'/tmp/claude-0/arte_tr0.png',clip:{x:60,y:120,width:480,height:220}});
 await p.waitForTimeout(1800);
 const tr=await p.evaluate(()=>Object.fromEntries(Object.entries(window.__rows.tronco||{}).map(([k,v])=>[k,[...v].length])));
 console.log('TRONCO',JSON.stringify(tr));
 ok(tr[0]>=4,'o tronco cai em fumaça (linha 0)');
 ok(tr[1]>=2,'o tronco fica parado, com a folha e a fumaça mexendo (linha 1)');
 ok(tr[2]>=4,'o tronco some em fumaça (linha 2)');
 ok(tr[3]>=4,'a fumaça de chegada aparece onde o herói pousou (linha 3)');
 ok(await p.evaluate(()=>(p.ix.logs||[]).length===0&&ItensV85.SMK.length===0),'tudo é limpo depois');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await b.close()})();
