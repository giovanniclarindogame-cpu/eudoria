'use strict';
// Modo economia: limita a 30 quadros por segundo, usa efeitos leves e resolução menor do canvas.
// Pensado para celulares fracos (especialmente nas lutas 2×2). Preferência salva neste aparelho.
(function(){
 const KEY='eldoria.economia.v1';
 let on=false;
 try{on=localStorage.getItem(KEY)==='1'}catch{}
 let lastT=0,lastP=0,ema=16.7,slowMs=0,autoDone=false,lowResDone=false;
 // Proteção automática: se a luta roda abaixo de ~26 quadros/s por 3 s, liga o modo economia (e baixa a resolução se ainda estiver pior que ~15 q/s)
 function feed(d){
  if(d>400)return;                                   // pausa, troca de aba, etc.
  ema=ema*.93+d*.07;
  if(!on&&ema>38){slowMs+=d;if(slowMs>3000&&!autoDone){autoDone=true;set(true);try{toast('O jogo estava lento: Modo economia ligado (dá para desligar em Configurações).')}catch{}}}
  else if(!on)slowMs=0;
  if(on&&ema>68&&!lowResDone){lowResDone=true;window.renderCap=1;try{resize()}catch{}}
 }
 const origFrame=frame;
 frame=function(t){
  if(on&&t-lastT<28){requestAnimationFrame(frame);return}
  lastT=t;
  if(lastP&&typeof state!=='undefined'&&state==='fight'&&!document.hidden)feed(t-lastP);
  lastP=t;
  origFrame(t);
 };
 function apply(){
  window.ecoMode=on;
  window.renderCap=on?1.5:undefined;
  if(on)vfxSetQuality('low');
  document.documentElement.dataset.eco=on?'1':'0';
  try{if(typeof resize==='function'&&document.querySelector('#battle')?.style.display==='block')resize()}catch{}
 }
 function set(v){
  on=!!v;
  try{localStorage.setItem(KEY,on?'1':'0')}catch{}
  apply();
  const q=document.getElementById('lobbyQuality');if(q&&on)q.value='low';
 }
 apply();
 const prev=openLobbySettings;
 openLobbySettings=function(){
  prev();
  const motion=document.querySelector('#lobbySettings .lobby-motion-option');
  if(!motion||document.getElementById('ecoMode'))return;
  motion.insertAdjacentHTML('afterend',`<label class="lobby-motion-option eco-option"><input id="ecoMode" type="checkbox" ${on?'checked':''}><span>Modo economia<small>Jogo a 30 quadros, efeitos leves e imagem mais suave. Ajuda em celulares que travam.</small></span></label>`);
 };
 document.addEventListener('change',e=>{if(e.target.id==='ecoMode')set(e.target.checked)});
 window.EcoQA={get on(){return on},set,fps(){return on?30:60},feed,reset(){ema=16.7;slowMs=0;autoDone=false;lowResDone=false}};
})();
