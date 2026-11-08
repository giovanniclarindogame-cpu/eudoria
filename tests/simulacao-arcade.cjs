// Simulação da Cruzada Arcade (bot jogando e andando pela fase). uso: node tests/simulacao-arcade.cjs <chefe> <solo|duo> <partidas> [skin]   (SKIP=1 vai direto ao chefe)
const {chromium}=require('playwright');
const [id,team,N,skin]=[process.argv[2]||'zorvath',process.argv[3]||'solo',+process.argv[4]||5,+(process.argv[5]??0)];
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:844,height:390}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text().slice(0,200))});
 await pg.goto('http://localhost:8000/index.html');await pg.waitForTimeout(800);
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('input','Teste');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(1400);
 const res=await pg.evaluate(async({id,team,N,skin,skip})=>{window.__skip=skip;
  let seed=11;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  ArcadeAPI.setSave({team,sel:id,cleared:{}});
  const out=[];
  for(let n=0;n<N;n++){
   ArcadeAPI.startStage();window.requestAnimationFrame=()=>0;
   p.skin=skin;p.kit=[...CHAMPIONS[skin].kit];p.hp=p.max=1000;
   state='fight';count=0;
   const S=ArcadeAPI.S;if(window.__skip){S.nextTrig=ArcadeAPI.WAVES.length;S.camX=3200;p.x=3560}let steps=0,minHp=1e9,food=0,reachedBoss=0,waveMax=-1,phases=new Set();
   while(state==='fight'&&steps<60*900){
    const dt=1/60;
    if(S.phase==='walk'||S.phase==='boss-intro'&&false){
     const nx=S.nextTrig<ArcadeAPI.WAVES.length?ArcadeAPI.TRIG[S.nextTrig]+30:ArcadeAPI.BOSS_TRIG+30;
     const fd=p.hp<p.max*.9&&S.food.find(f=>f.x>p.x-60&&f.x<nx&&f.x>S.camX-S.viewW/2+40);const tx=fd&&fd.x<nx?fd.x:nx,ty=fd&&fd.x<nx?fd.y:p.y;
     const a=Math.atan2(ty-p.y,tx-p.x);move(p,Math.cos(a)*150*dt,Math.sin(a)*150*dt);p.a=a;
     for(const al of actors)if(al!==p&&al.team===0){const aa=Math.atan2(p.y-al.y,p.x-al.x);if(Math.hypot(p.x-al.x,p.y-al.y)>80)move(al,Math.cos(aa)*150*dt,Math.sin(aa)*150*dt)}
    }else if(S.food.length&&p.hp<p.max*.55){const f=S.food[0],a=Math.atan2(f.y-p.y,f.x-p.x);move(p,Math.cos(a)*150*dt,Math.sin(a)*150*dt)}else ai(dt,p);
    step(dt);steps++;
    waveMax=Math.max(waveMax,S.wave);if(S.bossOn&&!reachedBoss){reachedBoss=1;S.hpAtBoss=Math.round(p.hp)}phases.add(S.phase);
   }
   out.push({hpAtBoss:S.hpAtBoss,snap:steps>=60*900?{phase:S.phase,wave:S.wave,nt:S.nextTrig,cam:Math.round(S.camX),px:Math.round(p.x),py:Math.round(p.y),mobs:S.mobs.map(a=>[a.mob.type,Math.round(a.hp),Math.round(a.x),Math.round(a.y),a.mob.windup>0?1:0,a.moving?1:0]),q:S.queue.length,food:S.food.length}:null,win:modeRun.settled&&S.bossOn&&actors.every(a=>a!==b||a.hp<=0)&&!(p.hp<=0),end:state,t:Math.round(steps/60),wave:waveMax,boss:reachedBoss,kills:S.kills,hp:Math.round(p.hp),bossHp:Math.round(b.hp),phases:[...phases].join('>')});
   try{leave()}catch(e){}
  }
  return out},{id,team,N,skin,skip:!!process.env.SKIP});
 console.log(id,team);for(const r of res)console.log(JSON.stringify(r));console.log('errs',errs.slice(0,4));
 await br.close()})();
