// Menus v3: só 3 habilidades + ultimate; nomes do Ronin Carmesim sem termos de outras obras; retrato maior.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{
 const br=await chromium.launch();const p=await (await br.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Giovanni');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
 const names=await p.evaluate(()=>CHAMPIONS[2].kit.map(id=>skills[id].name).concat([CHAMPIONS[2].ult,CHAMPIONS[2].ref,CHAMPIONS[2].summary]).join(' | '));
 ok(!/Getsuga|Shunpo|Bankai|Mugetsu|Ichigo|Quebra de Guarda/i.test(names),'Ronin Carmesim sem nomes de outras obras: '+names.slice(0,120));
 const solar=await p.evaluate(()=>CHAMPIONS[3].kit.map(id=>skills[id].name).concat([CHAMPIONS[3].ult,CHAMPIONS[3].ref,CHAMPIONS[3].title]).join(' | '));
 ok(!/Rengoku|Nona Forma|Dragão Solar|Respiração/i.test(solar),'Guardião Solar sem nomes de outras obras: '+solar.slice(0,140));
 for(const id of [0,1,2,5]){
  const r=await p.evaluate(id=>{openChampionDetails(id);const el=document.getElementById('heroDetail');const b=[...el.querySelectorAll('.hero-kit [data-hero-skill]')];const r={n:b.length,labels:b.map(x=>x.textContent.trim()).join(','),stat:[...el.querySelectorAll('.hero-stat')].map(s=>s.textContent.replace(/\s+/g,' ')).join('|'),act:el.querySelector('.hero-kit .active')?.dataset.heroSkill};closeHeroDetail();return r},id);
  ok(r.n===4&&r.labels.replace(/\s/g,'')==='1,2,3,ULT'.replace(/,/g,',')||r.n===4&&/^[^]*ULT$/.test(r.labels)&&!/5 \+/.test(r.stat),`detalhe do campeão ${id}: 3 habilidades + ULT (${r.labels})`);
 }
 const lb=await p.evaluate(()=>{showScreen('home');renderLobbyBuild();return document.querySelectorAll('#lobbyBuild .lobby-build-icons>span').length});
 ok(lb===4,'início mostra 4 ícones');
 const kp=await p.evaluate(()=>(kitPreview(CHAMPIONS[3].kit).match(/ title=/g)||[]).length);
 ok(kp===4,'prévia de kit com 4 ícones');
 const pr=await p.evaluate(()=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.naturalWidth,i.naturalHeight]);i.src='assets/ichigo_v27/portrait.webp'}));
 ok(pr[1]/pr[0]<1.5,'retrato do Ronin recortado (menos margem) '+pr);
 ok(errs.length===0,'sem erros '+errs.slice(0,2));
 await br.close();
})();
