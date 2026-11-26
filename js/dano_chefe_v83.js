/* Dano do chefe que o jogador SENTE na tela: borda vermelha que pulsa conforme o tamanho do golpe.
   Funciona offline e online (convidado) porque observa a vida do próprio jogador na Caçada. */
(function(){
 'use strict';
 let last=null,lastT=0,el=null;
 const emCacada=()=>{try{return !!((modeRun&&modeRun.hunt)||(window.OnlineV46&&OnlineV46.match&&OnlineV46.match.caca))}catch{return false}};
 const online=()=>{try{return !!(window.OnlineV46&&OnlineV46.match&&OnlineV46.match.on)}catch{return false}};
 function criar(){
  if(el&&el.isConnected)return el;
  const b=document.getElementById('battle');if(!b)return null;
  el=document.createElement('div');el.id='hurt83';el.setAttribute('aria-hidden','true');b.appendChild(el);return el;
 }
 function pulsar(frac,heavy){
  const e=criar();if(!e)return;
  e.style.setProperty('--f',String(Math.min(1,.25+frac*3)));
  e.classList.remove('on','forte');void e.offsetWidth;e.classList.add('on');if(heavy)e.classList.add('forte');
  clearTimeout(pulsar.t);pulsar.t=setTimeout(()=>e&&e.classList.remove('on','forte'),heavy?900:520);
 }
 const prev=step;
 step=function(dt){
  try{
   if(typeof p!=='undefined'&&p&&emCacada()&&state==='fight'){
    if(last!==null&&p.hp<last-1){
     const lost=last-p.hp,frac=lost/Math.max(1,p.max||1000),heavy=lost>=60;
     if(!(p.blockFlash>0&&lost<25)){pulsar(frac,heavy);if(online()){combatShake=Math.max(combatShake,heavy?9:4)}}
    }
    last=p.hp;
   }else last=null;
  }catch(e){}
  return prev.apply(this,arguments);
 };
 window.DanoChefeV83={pulsar};
})();
