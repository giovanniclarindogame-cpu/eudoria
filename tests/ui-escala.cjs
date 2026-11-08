// Escala única da interface: a batalha e os menus são desenhados para 844x390 e crescem por --ui.
// Em qualquer tamanho: nada fora da tela, sem rolagem horizontal, controles ancorados nos cantos e sem sobreposição.
// Requer Playwright e servidor local: python3 -m http.server 8000
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const SIZES=[[844,390],[667,375],[1000,450],[1280,720],[1366,768],[2000,900],[1024,768]];
const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left,y:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}};
(async()=>{
 const b=await chromium.launch();
 for(const [w,h] of SIZES){
  const tag=`${w}x${h}`;
  const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1500);
  const ui=await p.evaluate(()=>+getComputedStyle(document.documentElement).getPropertyValue('--ui'));
  const exp=Math.min(1.8,Math.max(1,Math.min(w/844,h/390)));
  ok(Math.abs(ui-exp)<.01,`${tag}: --ui = ${ui.toFixed(2)} (esperado ${exp.toFixed(2)})`);
  // menus: tudo dentro da tela
  for(const [name,fn] of [['início',()=>showScreen('home')],['campeões',()=>showScreen('library')],['dojo',()=>showScreen('training')],['liga',()=>showScreen('league')],['arenas',()=>showArenaModes()],['caçada',()=>beginArenaMode('guardian')]]){
   await p.evaluate(()=>{if(typeof closeHeroDetail==='function')closeHeroDetail();showScreen('home')});await p.waitForTimeout(200);
   await p.evaluate(fn);await p.waitForTimeout(800);
   const m=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,sh:document.documentElement.scrollHeight,ih:innerHeight}));
   ok(m.sw<=m.iw+1&&m.sh<=m.ih+1,`${tag}: ${name} sem rolagem da página`);
  }
  await p.evaluate(()=>showScreen('home'));await p.waitForTimeout(500);
  const home=await p.evaluate(rectFns=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left,y:r.top,r:r.right,b:r.bottom}};
   const nav=[...document.querySelectorAll('#lobbyNav button')].map(e=>e.getBoundingClientRect());
   return{play:q('.royal-play'),wallet:q('.royal-wallet'),settings:q('#openLobbySettings'),hunt:q('.hunt-home'),navLast:nav[nav.length-1]&&{b:nav[nav.length-1].bottom,r:nav[nav.length-1].right},iw:innerWidth,ih:innerHeight}});
  const inside=r=>r&&r.x>=-1&&r.y>=-1&&r.r<=home.iw+1&&r.b<=home.ih+1;
  ok(inside(home.play)&&inside(home.wallet)&&inside(home.settings)&&inside(home.hunt),`${tag}: início — JOGAR, carteira, configurações e Caçada dentro da tela`);
  ok(home.navLast&&home.navLast.b<=home.ih+1,`${tag}: início — todos os itens do menu lateral visíveis`);
  // batalha (Caçada em dupla)
  await p.evaluate(()=>beginArenaMode('guardian'));await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('[data-hunt-start]').click());await p.waitForTimeout(4000);
  const bt=await p.evaluate(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left,y:r.top,r:r.right,b:r.bottom}};
   return{hud:q('.hud'),team:q('#teamHud'),stick:q('#stick'),skills:q('.equipped'),act:q('.action-group'),atk:q('#attack'),def:q('#defend'),dod:q('#dodge'),pause:q('#pauseBtn'),zoom:q('#arenaZoom'),iw:innerWidth,ih:innerHeight,sw:document.documentElement.scrollWidth}});
  const hit=(a,c)=>a&&c&&a.x<c.r-1&&a.r>c.x+1&&a.y<c.b-1&&a.b>c.y+1;
  const pairs=[['stick','skills'],['stick','act'],['skills','act'],['hud','skills'],['hud','act'],['hud','stick'],['pause','zoom'],['skills','pause'],['act','pause'],['skills','zoom'],['atk','dod'],['dod','def']];
  const bad=pairs.filter(([a,c])=>hit(bt[a],bt[c])).map(x=>x.join('×'));
  ok(bad.length===0,`${tag}: batalha sem sobreposição ${bad.join(',')}`);
  ok(['hud','stick','skills','act','pause','zoom'].every(k=>inside2(bt[k],bt)),`${tag}: batalha — HUD e controles dentro da tela`);
  const edge=bt.iw-bt.act.r,expEdge=18*exp;
  ok(Math.abs(edge-expEdge)<4,`${tag}: batalha — ações ancoradas no canto direito (${edge.toFixed(0)}px ≈ ${expEdge.toFixed(0)}px)`);
  ok(bt.sw<=bt.iw+1,`${tag}: batalha sem rolagem horizontal`);
  ok(errs.length===0,`${tag}: sem erros de JavaScript ${errs.join('|')}`);
  await p.close();
 }
 await b.close();
 function inside2(r,m){return r&&r.x>=-1&&r.y>=-1&&r.r<=m.iw+1&&r.b<=m.ih+1}
})();
