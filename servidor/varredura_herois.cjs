const { load, startDuel } = require('./carregador.cjs');
(async()=>{
 for(const h of [0,1,2,3,4,5,6,7,8,9]){
  const g=await load();g.ev(`window.__sim=1000;performance.now=function(){return window.__sim}`);await startDuel(g);const f=(h+4)%10;
  g.ev(`for(const f of ['updateUI','announce','toast','hydrateSkillIcons','refreshModeKit','drawStrips']){try{window[f]=function(){}}catch{}}
   V3Modes.swapHero(b,${h},1000);V3Modes.swapHero(p,${f},1000);window.__hits=0;window.__dmg=0;window.__by={};
   const _h=hit;hit=function(t,n,o,k,an,id){const hp=t.hp,r=_h.apply(this,arguments);const d=hp-t.hp;if(d>0&&o===b){window.__hits++;window.__dmg+=d;window.__by[id]=(window.__by[id]||0)+1}return r};
   window.__tick=function(){window.__sim+=1000/30;try{ai(1/30,p);step(1/30)}catch(e){}if(state==='end'||state==='select'){window.__ends=(window.__ends||0)+1;queueMatch('1v1');V3Modes.swapHero(b,${h},1000);V3Modes.swapHero(p,${f},1000)}}`);
  const w=g.dom.window;for(let i=0;i<3600;i++)w.__tick();
  console.log(g.ev(`CHAMPIONS[${h}].name`),'→ acertos do herói no rival:',g.ev('__hits'),'dano causado:',Math.round(g.ev('__dmg')),'| golpes diferentes que acertaram:',Object.keys(g.ev('__by')).length,'| partidas terminadas:',g.ev('window.__ends||0'));
 }
 process.exit(0)})();
