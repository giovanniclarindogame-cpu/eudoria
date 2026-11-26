'use strict';
/*
 * v82 — cena de transformação do chefe da Caçada (forma 1 → 2 → 3), estilo cinematográfico:
 *  1) a luta CONGELA (só offline; no online o servidor segue) enquanto a tela treme, as barras de cinema descem e o título aparece;
 *  2) a câmera aproxima do chefe; 3) na hora em que o corpo muda: clarão branco, onda de choque, faíscas e tremor forte; 4) tudo se desfaz.
 * Funciona igual para quem joga offline e para quem vê o chefe pelo servidor (a deixa é o chefe entrar na ação "xform").
 */
(function(){
const $q=s=>document.querySelector(s);
const S={on:false,t0:0,shown:1,freezeUntil:0,zoom:0,last:0,swapAt:0,vistas:0};
const NOMES={2:['FORMA 2','LIBERTO','Zorvath libera mais poder'],3:['FORMA 3','PERFEITO','Zorvath mostra o poder verdadeiro']};
const online=()=>{try{return !!(window.OnlineV46&&OnlineV46.match&&OnlineV46.match.on)}catch{return false}};
function el(){
 let e=$q('#cine82');if(e)return e;
 const b=$q('#battle');if(!b)return null;
 e=document.createElement('div');e.id='cine82';e.setAttribute('aria-hidden','true');
 e.innerHTML='<i class="c82-vig"></i><i class="c82-bar top"></i><i class="c82-bar bot"></i><i class="c82-flash"></i><div class="c82-title"><small></small><b></b><em></em></div>';
 b.appendChild(e);return e;
}
function clarao(forte){
 const e=el();if(!e)return;const f=e.querySelector('.c82-flash');
 f.classList.remove('go','forte');void f.offsetWidth;f.classList.add('go');if(forte)f.classList.add('forte');
}
function iniciar(R){
 const e=el();if(!e)return;
 const n=NOMES[R.form]||NOMES[2];
 S.on=true;S.t0=performance.now();S.shown=R.shown||1;S.swapAt=0;S.vistas++;
 e.dataset.forma=String(R.form);e.querySelector('.c82-title small').textContent=n[2].toUpperCase();
 e.querySelector('.c82-title b').textContent=n[0];e.querySelector('.c82-title em').textContent=n[1];
 e.classList.remove('out');e.classList.add('on');void e.offsetWidth;
 if(!online())S.freezeUntil=S.t0+650;   // congela a luta por 0,65 s (o servidor não congela: no online só há o efeito visual)
 try{combatShake=Math.max(combatShake,9);combatHitStop=Math.max(combatHitStop,.05)}catch{}
 clarao(false);
 try{const A=R.a;ring(A.x,A.y,120,'#ffd0ee',.8);spark(A.x,A.y,'#ff62a8',16);combatSound&&combatSound('heavy',1.2)}catch{}
}
function trocou(R){
 S.swapAt=performance.now();clarao(true);
 try{combatShake=14;const A=R.a;ring(A.x,A.y,190,'#ffffff',.7);ring(A.x,A.y,130,'#ff62a8',.65);ring(A.x,A.y,80,'#b86bff',.6);spark(A.x,A.y,'#ffd0ee',34);combatSound&&combatSound('crit',1.5)}catch{}
}
function encerrar(){
 S.on=false;S.freezeUntil=0;const e=$q('#cine82');if(e){e.classList.add('out');setTimeout(()=>{if(!S.on)e.classList.remove('on','out')},600)}
}
const prevStep=step;
step=function(dt){
 const agora=performance.now(),R=(typeof modeRun!=='undefined'&&modeRun&&modeRun.hunt)||null;
 try{
  if(R&&state==='fight'){
   const id=R.act?R.act.id:null;
   if(id==='xform'&&!S.on)iniciar(R);
   else if(S.on&&id!=='xform')encerrar();
   if(S.on&&(R.shown||1)>S.shown){S.shown=R.shown;trocou(R)}
  }else if(S.on&&!R)encerrar();
  // zoom da câmera (0..1): sobe em 0,5 s, segura até o corpo mudar, volta em 0,7 s
  const k=S.on?Math.min(1,(agora-S.t0)/500)*(S.swapAt?Math.max(0,1-(agora-S.swapAt)/700):1):Math.max(0,S.zoom-(agora-S.last)/700);
  S.zoom=k;S.last=agora;
  if(S.on&&agora<S.freezeUntil){combatShake=Math.max(combatShake,4+3*Math.sin(agora/18));return}   // luta congelada: só treme
 }catch(e){}
 return prevStep.apply(this,arguments);
};
const prevCam=updateArenaCamera;
updateArenaCamera=function(){
 prevCam.apply(this,arguments);
 try{
  if(S.zoom<=.001)return;const R=modeRun&&modeRun.hunt;if(!R||!R.a)return;
  const A=R.a,sx=A.x*scale+ox,sy=A.y*scale+oy;scale*=1+S.zoom*.2;ox=sx-A.x*scale;oy=sy-A.y*scale;
 }catch{}
};
window.CineV82={S,iniciar,trocou};
})();
