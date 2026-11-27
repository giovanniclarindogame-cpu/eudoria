// Acessórios (v85): 18 itens, slot e compra na tela do campeão, botão ITEM na luta e o efeito de CADA item.
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const b=await chromium.launch();const errs=[];
 const p=await (await b.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true,deviceScaleFactor:1})).newPage();
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1&itenspagos=1');   // modo cobrando (para testar a compra)
 await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
 await p.evaluate(()=>{const b=document.querySelector('[data-tut-go]');if(b){let e=b;while(e.parentElement&&getComputedStyle(e).position!=='fixed')e=e.parentElement;e.style.display='none'}});

 /* ---------- dados ---------- */
 const D=await p.evaluate(()=>({n:ItensV85.ITENS.length,ids:ItensV85.IDS,unicos:new Set(ItensV85.IDS).size,idx:ItensV85.ITENS.every((d,i)=>d.idx===i),tem:Object.keys(ItensV85.conta().tem),tipos:[...new Set(ItensV85.ITENS.map(d=>d.tipo))].sort(),rar:[...new Set(ItensV85.ITENS.map(d=>d.rar))].sort()}));
 ok(D.n===18&&D.unicos===18&&D.idx,'são 18 itens, ids únicos e índices na ordem do protocolo');
 const srv=require(path.join(__dirname,'..','servidor','itens.cjs'));
 ok(JSON.stringify(srv)===JSON.stringify(D.ids),'a lista do servidor (servidor/itens.cjs) é igual à do jogo, na mesma ordem');
 ok(D.tem.join()==='pilula','só a Pílula dos Deuses vem de graça');
 ok(D.tipos.join()==='ativo,reativo,uso'&&D.rar.join()==='comum,lendario,raro','os 3 tipos e as 3 raridades existem');

 /* ---------- tela do campeão: slot, compra, equipar, persistência ---------- */
 await p.evaluate(()=>{showScreen('library');account.coins=2000;saveAccount()});await p.waitForTimeout(400);
 await p.evaluate(()=>openChampionDetails(5));await p.waitForTimeout(700);
 ok(await p.evaluate(()=>{const k=document.querySelector('#heroDetail .hero-kit');const t=[...k.children].map(x=>Math.round(x.getBoundingClientRect().top));return k.children.length===7&&new Set(t).size===1}),'o slot de item fica na mesma fileira dos ícones do campeão');
 await p.click('.item85-slot');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.querySelectorAll('.it85-cell').length===18),'a janela do acessório lista os 18 itens');
 await p.waitForTimeout(600);
 const dims=await p.evaluate(()=>[...document.querySelectorAll('.it85-cell img')].map(i=>[i.naturalWidth,i.naturalHeight]));
 ok(dims.length===18&&dims.every(d=>d[0]===256&&d[1]===256),'os 18 ícones da janela são imagens 256x256 (uma folha de animação com o nome do ícone já estragou isso) ('+dims.filter(d=>d[0]!==256).length+' errados)');
 await p.click('[data-it85-item=mascara]');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>/Comprar · ◉ 1500/.test(document.querySelector('.it85-acts').innerText)),'item não comprado mostra o preço');
 await p.click('[data-it85-item=licenca]');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>/Faltam ◉ 1500/.test(document.querySelector('.it85-acts').innerText)),'sem moedas suficientes o botão avisa quanto falta');
 ok(await p.evaluate(()=>{const t=document.querySelector('#it85Det').innerText;return !/Bleach|Naruto|Dragon Ball|One Piece|Jujutsu|Hunter x Hunter|Fullmetal|Boku no Hero|Cavaleiros do Zodíaco/i.test(t.split('\n').slice(0,2).join(' '))}),'a janela não mostra o nome do anime embaixo do item');
 await p.click('[data-it85-item=mascara]');await p.click('[data-it85=comprar]');await p.waitForTimeout(150);
 const c1=await p.evaluate(()=>({coins:account.coins,tem:ItensV85.tem('mascara'),btn:document.querySelector('.it85-acts').innerText}));
 ok(c1.coins===500&&c1.tem&&/Equipar/.test(c1.btn),'comprar desconta as moedas e libera o item ('+JSON.stringify(c1)+')');
 await p.click('[data-it85=equipar]');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>ItensV85.eqDe(5)==='mascara'&&/Remover/.test(document.querySelector('.it85-acts').innerText)),'equipar coloca o item no campeão');
 await p.click('.it85-x');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>!document.querySelector('#itens85')&&document.querySelector('.item85-slot .it85-ico:not(.vazio)')!==null),'o slot do campeão passa a mostrar o item equipado');
 await p.reload();await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>ItensV85.eqDe(5)==='mascara'&&ItensV85.tem('mascara')&&account.coins===500),'a compra e o item equipado continuam depois de recarregar a página');
 await p.evaluate(()=>{ItensV85.equipar(5,null);ItensV85.equipar(5,'pilula')});

 /* ---------- luta: botão + efeitos ---------- */
 await p.evaluate(()=>{for(const id of ItensV85.IDS)ItensV85.conta().tem[id]=true;ItensV85.equipar(0,'pilula');matchMode='1v1';battleActivity='training';account.activeChampion=0;selected=[...CHAMPIONS[0].kit];start()});
 await p.waitForFunction(()=>state==='fight',null,{timeout:25000});await p.waitForTimeout(800);
 const H=await p.evaluate(()=>{const e=document.getElementById('itemBtn85');return{vis:!!e&&!e.hidden,cls:e?.className,item:p.item?.id}});
 ok(H.vis&&H.item==='pilula'&&/pronto/.test(H.cls),'na luta aparece o botão ITEM pronto, com o item do campeão ('+JSON.stringify(H)+')');
 await p.screenshot({path:'/tmp/claude-0/it_luta.png'});
 // toca no botão: usa a pílula
 await p.evaluate(()=>{p.hp=500;b.x=p.x+400;b.y=p.y});
 await p.evaluate(()=>{document.getElementById('itemBtn85').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}))});await p.waitForTimeout(200);
 const u=await p.evaluate(()=>({hp:Math.round(p.hp),usado:p.item.used,cls:document.getElementById('itemBtn85').className,lb:document.querySelector('#itemBtn85 .lb').textContent}));
 ok(u.hp===750&&u.usado,'tocar no botão usa a Pílula dos Deuses: +25% da vida (500 → '+u.hp+')');
 ok(/usado/.test(u.cls)&&u.lb==='USADO','depois do uso o botão mostra USADO');
 await p.evaluate(()=>{p.hp=300});
 ok(await p.evaluate(()=>window.itemUse(p,0)===false&&Math.round(p.hp)===300),'consumível só vale 1 vez por luta');

 // efeitos de cada item
 const R=await p.evaluate(async()=>{
  const out={};let kb=1;const idx=id=>ItensV85.BY[id].idx;
  const steps=sec=>{for(let i=0;i<Math.round(sec*60);i++){if(state!=='fight')break;step(1/60)}};
  const reset=id=>{ItensV85.equip(p,id);ItensV85.equip(b,null);p.hp=p.max=1000;b.hp=b.max=1000;p.inv=b.inv=0;p.root=b.root=0;p.slow=b.slow=0;p.guardBreak=0;p.x=400;p.y=300;b.x=700;b.y=300;p.a=0;b.a=Math.PI;p.cast=b.cast=0;p.cd.fill(0);b.cd.fill(0);if(window.DEC)ItensV85.DEC.length=0;
   // o rival do treino sorteia o campeão e alguns têm bônus que crescem com o tempo: a base de dano é medida logo antes de cada item
   const h=p.hp;p.inv=0;hit(p,100,b,0,0);kb=(h-p.hp)/100;p.hp=h;p.inv=0;p.hitReact=0;p.flash=0};
  const dmgOn=(t,o,n=100)=>{const h=t.hp;t.inv=0;hit(t,n,o,0,0);return h-t.hp};
  const base=dmgOn(b,p);
  // cura
  reset('pilula');p.hp=500;itemUse(p,idx('pilula'));out.pilula=Math.round(p.hp);
  reset('doce');p.hp=500;itemUse(p,idx('doce'));p.inv=99;b.root=99;steps(5.2);out.doce=Math.round(p.hp);   // (sem golpes do rival durante a medida)
  reset('carne');p.hp=500;itemUse(p,idx('carne'));out.carne=[Math.round(p.hp),+ItensV85.mod(p,'spd').toFixed(2)];
  reset('sangue');itemUse(p,idx('sangue'));p.hp=500;const d=dmgOn(b,p);out.sangue=[Math.round(p.hp-500),d];
  // defesa
  reset('escudo');p.a=0;itemUse(p,idx('escudo'));out.escudo=+(dmgOn(p,b,200)/kb).toFixed(1);   // golpe vindo da frente (b está à direita, p olha para a direita)
  reset('escudo');p.a=Math.PI;itemUse(p,idx('escudo'));out.escudoCostas=+(dmgOn(p,b,200)/kb).toFixed(1);
  reset('chapeu');itemUse(p,idx('chapeu'));const x0=p.x;p.inv=0;hit(p,100,b,60,Math.PI);out.chapeu=[+((1000-p.hp)/kb).toFixed(1),Math.round(Math.abs(p.x-x0))];
  reset('tronco');itemUse(p,idx('tronco'));out.tronco=[Math.round(Math.hypot(p.x-400,p.y-300)),p.inv>0];
  reset('cantil');p.root=2;p.slow=2;p.guardBreak=1;itemUse(p,idx('cantil'));out.cantil=[p.root,p.slow,p.guardBreak,+(dmgOn(p,b,100)/kb).toFixed(1)];
  reset('licenca');p.hp=30;ItensV85.equip(p,'licenca');p.hp=30;hit(p,900,b,0,0);out.licenca=[Math.round(p.hp),p.inv>1,p.item.used,canUseUltimate(p)];
  // ataque
  reset('pesos');itemUse(p,idx('pesos'));out.pesos=[+(dmgOn(b,p)/base).toFixed(2),+ItensV85.mod(p,'spd').toFixed(2)];steps(5.2);out.pesosFim=+ItensV85.mod(p,'spd').toFixed(2);steps(1.6);out.pesosFim2=+ItensV85.mod(p,'spd').toFixed(2);
  reset('mascara');itemUse(p,idx('mascara'));out.mascara=[+(dmgOn(b,p)/base).toFixed(2),+(dmgOn(p,b,100)/kb).toFixed(1)];
  reset('caderno');itemUse(p,idx('caderno'));out.caderno=+(dmgOn(b,p)/base).toFixed(2);
  reset('brasa');p.hp=250;steps(.2);b.hp=1000;out.brasa=[p.item.armed,+(dmgOn(b,p)/base).toFixed(2)];steps(1.2);out.brasaQueima=1000-b.hp>0;
  // utilidade
  reset('kon');itemUse(p,idx('kon'));out.kon=[ItensV85.DEC.length,enemy(b)===ItensV85.DEC[0],opponents(b).includes(ItensV85.DEC[0])];steps(3.3);out.konFim=ItensV85.DEC.length;
  reset('carta');itemUse(p,idx('carta'));out.carta=[b.root>=.79,itemUse(p,idx('carta'))];
  reset('venda');const k0=p.kit[0];p.cd[k0]=10;itemUse(p,idx('venda'));steps(5);out.venda=+p.cd[k0].toFixed(1);
  reset('chakra');for(let i=0;i<6;i++)p.cd[p.kit[i]]=9;itemUse(p,idx('chakra'));out.chakra=[p.cd[p.kit[0]],p.cd[p.kit[4]],p.cd[p.kit[5]]];
  reset('relogio');const n0=objects.filter(o=>o.kind==='wall').length;itemUse(p,idx('relogio'));out.relogio=objects.filter(o=>o.kind==='wall').length-n0;
  // recarga dos ativos
  reset('tronco');itemUse(p,idx('tronco'));out.recarga=[itemUse(p,idx('tronco')),Math.round(p.item.cd)];
  out.base=base;return out});
 console.log('EFEITOS',JSON.stringify(R));
 ok(R.pilula===750,'Pílula dos Deuses: +25% da vida');
 ok(R.doce>=690&&R.doce<=710,'Doce do Mestre: +20% da vida em 5 s ('+R.doce+')');
 ok(R.carne[0]===650&&R.carne[1]===1.1,'Carne com Osso: +15% da vida e +10% de velocidade');
 ok(R.sangue[0]>0&&Math.abs(R.sangue[0]-R.sangue[1]*.08)<2,'Sangue de Atena: cura 8% do dano causado ('+R.sangue+')');
 ok(Math.abs(R.escudo-50)<2&&Math.abs(R.escudoCostas-200)<2,'Escudo do Dragão: absorve 150 de frente e não protege pelas costas ('+R.escudo+'/'+R.escudoCostas+')');
 ok(Math.abs(R.chapeu[0]-85)<2&&R.chapeu[1]===0,'Chapéu de Palha: 15% menos dano e sem empurrão ('+R.chapeu+')');
 ok(R.tronco[0]>=140&&R.tronco[0]<=160&&R.tronco[1],'Tronco de Substituição: salta ~150 e fica invulnerável ('+R.tronco+')');
 ok(R.cantil[0]===0&&R.cantil[1]===0&&R.cantil[2]===0&&Math.abs(R.cantil[3]-70)<2,'Cantil do Amanhecer: limpa controle e dá 30% menos dano ('+R.cantil+')');
 ok(R.licenca[0]===80&&R.licenca[1]&&R.licenca[2]&&!R.licenca[3],'Licença de Hunter: sobrevive com 8%, fica invulnerável e a ultimate bloqueia ('+R.licenca+')');
 ok(R.pesos[0]===1.15&&R.pesos[1]===1.25&&R.pesosFim===.8&&R.pesosFim2===1,'Pesos de Treino: +15% dano, +25% velocidade e depois cansaço ('+R.pesos+' '+R.pesosFim+' '+R.pesosFim2+')');
 ok(Math.abs(R.mascara[0]-1.2)<.03&&Math.abs(R.mascara[1]-115)<2,'Máscara Oca: +20% de dano e +15% de dano recebido ('+R.mascara+')');
 ok(R.caderno===1.15,'Caderno de Análise: o rival marcado sofre +15% ('+R.caderno+')');
 ok(R.brasa[0]===false&&Math.abs(R.brasa[1]-1.2)<.03&&R.brasaQueima,'Brasa Eterna: acende sozinha abaixo de 30%, +20% de dano e queima ('+R.brasa+')');
 ok(R.kon[0]===1&&R.kon[1]&&R.kon[2]&&R.konFim===0,'Boneco Kon: isca vira alvo dos rivais e some em 3 s ('+R.kon+' '+R.konFim+')');
 ok(R.carta[0]&&R.carta[1]===false,'Carta de Contenção: prende ~0,8 s e não prende de novo em seguida ('+R.carta+')');
 ok(R.venda>=2.5&&R.venda<=3.5,'Venda Retirada: recarga 40% mais rápida (10 → '+R.venda+' em 5 s)');
 ok(R.chakra[0]===0&&R.chakra[1]===0&&R.chakra[2]===9,'Pílula de Chakra: zera as habilidades normais e preserva a ultimate ('+R.chakra+')');
 ok(R.relogio===1,'Relógio de Prata: ergue uma muralha');
 ok(R.recarga[0]===false&&R.recarga[1]>=40,'itens ativos entram em recarga e não valem de novo antes ('+R.recarga+')');
 /* ---------- liberado de graça (padrão por enquanto) ---------- */
 const g=await (await b.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true})).newPage();g.on('pageerror',e=>errs.push('grátis: '+e.message));
 await g.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await g.goto('http://localhost:8000/index.html?allheroes=1');await g.waitForTimeout(900);await g.getByText('ENTRAR',{exact:true}).click();await g.fill('#profileName','Teste');await g.getByText('Continuar',{exact:true}).click();await g.waitForTimeout(1800);
 await g.evaluate(()=>{const b=document.querySelector('[data-tut-go]');if(b){let e=b;while(e.parentElement&&getComputedStyle(e).position!=='fixed')e=e.parentElement;e.style.display='none'}});
 await g.evaluate(()=>{showScreen('library');account.coins=0;saveAccount()});await g.waitForTimeout(400);
 await g.evaluate(()=>openChampionDetails(3));await g.waitForTimeout(700);
 await g.click('.item85-slot');await g.waitForTimeout(300);
 const G=await g.evaluate(()=>({gratis:ItensV85.GRATIS,aviso:!!document.querySelector('.it85-free'),precos:document.querySelectorAll('.it85-cell i').length,cel:document.querySelectorAll('.it85-cell.lock').length}));
 ok(G.gratis&&G.aviso&&G.precos===0&&G.cel===0,'com os itens grátis: aviso na janela, nenhum preço e nenhum item bloqueado ('+JSON.stringify(G)+')');
 await g.click('[data-it85-item=licenca]');await g.waitForTimeout(150);
 ok(await g.evaluate(()=>/Equipar/.test(document.querySelector('.it85-acts').innerText)),'um item lendário aparece direto como "Equipar", sem comprar (mesmo com 0 moedas)');
 await g.click('[data-it85=equipar]');await g.waitForTimeout(150);
 const E=await g.evaluate(()=>({eq:ItensV85.eqDe(3),moedas:account.coins,tem:Object.keys(account.itens.tem).join()}));
 ok(E.eq==='licenca'&&E.moedas===0,'equipar funciona sem gastar moeda ('+JSON.stringify(E)+')');
 ok(E.tem==='pilula','a conta não grava a posse dos itens liberados (quando voltar a cobrar, só vale o que foi comprado)');
 await g.close();

 /* ---------- Caçada: o item vale contra o Boss (a isca atrai o Boss) ---------- */
 const q=await (await b.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true})).newPage();q.on('pageerror',e=>errs.push('caçada: '+e.message));
 await q.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await q.goto('http://localhost:8000/index.html?allheroes=1&inicio=0&semsala=1');await q.waitForTimeout(1000);
 await q.getByText('ENTRAR',{exact:true}).click();await q.fill('input','Teste');await q.getByText('Continuar',{exact:true}).click();await q.waitForTimeout(1600);
 await q.evaluate(()=>{ItensV85.conta().tem.kon=true;ItensV85.equipar(account.activeChampion||0,'kon')});
 await q.click('[data-hunt-home]');await q.waitForTimeout(1200);await q.click('[data-hunt-team=solo]');await q.click('[data-hunt-start]');
 await q.waitForFunction(()=>state==='fight',null,{timeout:25000});await q.waitForTimeout(1500);
 const K=await q.evaluate(async()=>{
  const R=modeRun.hunt,sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={item:p.item&&p.item.id,botao:!document.getElementById('itemBtn85').hidden};
  p.hp=p.max=3000;p.x=300;p.y=b.y;b.x=700;p.inv=999;
  itemUse(p,ItensV85.BY.kon.idx);
  for(let i=0;i<25;i++){p.x=300;p.y=b.y;await sleep(60)}   // o chefe está a ~400 de distância; a isca fica a ~120 do jogador
  out.isca=ItensV85.DEC.length;out.alvo=R.aggro&&R.aggro.itemDecoy===true;
  return out});
 console.log('CACADA',JSON.stringify(K));
 ok(K.item==='kon'&&K.botao,'na Caçada o campeão leva o item equipado e vê o botão ITEM');
 ok(K.isca===1&&K.alvo,'o Boss passa a perseguir a isca do Boneco Kon');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2));
 await b.close()})();
