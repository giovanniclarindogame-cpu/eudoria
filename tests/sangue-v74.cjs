// Sangue no chão mais discreto: rastro espaçado, uma marca quando para, pouca coisa por golpe e some no fim da luta.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:915,height:412}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
 await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent('ws://localhost:1'));await p.waitForTimeout(900);
 await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
 for(const [h,nome] of [[0,'Astral'],[1,'Ninja'],[4,'Eclipse'],[2,'Ronin']]){
  await p.evaluate(h=>{matchMode='1v1';battleActivity='duel';account.activeChampion=h;selected=[...CHAMPIONS[h].kit];start()},h);
  await p.waitForFunction(()=>state==='count'||state==='fight',null,{timeout:25000});
  await p.evaluate(()=>{state='fight';count=0;document.querySelector('#intro73')?.remove();b.x=W*.9;b.y=H*.12;b.hp=1e9;b.max=1e9;p.x=W*.15;p.y=H*.6});await p.waitForTimeout(500);
  const cont=()=>p.evaluate(()=>[typeof dojoBlood!=='undefined'?dojoBlood:[],typeof astralBlood!=='undefined'?astralBlood:[],typeof eclipseBlood!=='undefined'?eclipseBlood:[],typeof rpBlood!=='undefined'?rpBlood:[]].reduce((n,a)=>n+a.filter(e=>!e.strong).length,0));
  await p.evaluate(()=>{p.hp=p.max*.12;window.__w=setInterval(()=>{p.x+=1.4;p.moving=true;p.hp=p.max*.12},16)});await p.waitForTimeout(3000);
  await p.evaluate(()=>{clearInterval(window.__w);p.moving=false});
  const andando=await cont(),dist=await p.evaluate(()=>Math.round(p.x-W*.15));
  ok(andando<=Math.ceil(dist/46)+2,`${nome}: rastro espaçado — ${andando} marcas em ${dist}px (antes: uma a cada 18px)`);
  await p.evaluate(()=>{p.hp=p.max*.12});await p.waitForTimeout(1600);
  const parado=await cont();ok(parado>andando&&parado<=andando+2,`${nome}: ao ficar parado ferido aparece uma marca no chão (${andando}→${parado})`);
  const mais=await p.evaluate(async()=>{const n=()=>[typeof dojoBlood!=='undefined'?dojoBlood:[],typeof astralBlood!=='undefined'?astralBlood:[],typeof eclipseBlood!=='undefined'?eclipseBlood:[],typeof rpBlood!=='undefined'?rpBlood:[]].reduce((k,a)=>k+a.length,0);
   p.hp=p.max;p.inv=0;const a0=n();hit(p,200,b,0,0,-1);return n()-a0});
  ok(mais<=3,`${nome}: golpe forte deixa no máximo ${mais} marcas (spray + gotas)`);
  await p.evaluate(()=>{b.hp=0;finish()});await p.waitForFunction(()=>state==='end',null,{timeout:12000}).catch(()=>{});await p.waitForTimeout(2500);
  const fim=await p.evaluate(()=>[typeof dojoBlood!=='undefined'?dojoBlood:[],typeof astralBlood!=='undefined'?astralBlood:[],typeof eclipseBlood!=='undefined'?eclipseBlood:[],typeof rpBlood!=='undefined'?rpBlood:[]].reduce((n,a)=>n+a.length,0));
  ok(fim===0,`${nome}: no fim da luta o sangue some do chão (${fim} sobrando)`);
  await p.evaluate(()=>leave());await p.waitForTimeout(300);
 }
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));
 await b.close()})();
