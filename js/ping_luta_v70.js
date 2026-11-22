'use strict';
/*
 * v70 — ping na luta online: uma pílula pequena (sinal + "45 ms") ao lado do botão de pausa, no topo, onde não cobre a arena nem os botões.
 * Verde < 80 ms · amarelo < 180 ms · vermelho acima disso. Só aparece em luta online; o valor vem da medição que a conexão já faz (OnlineV45.state.rtt, a cada 2 s).
 */
(function(){
 const WIFI='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M4 12a17 17 0 0 1 24 0M8 16.5a11 11 0 0 1 16 0M12 21a5 5 0 0 1 8 0"/><circle cx="16" cy="25" r="1.6" fill="currentColor"/></svg>';
 let el=null,ultimo='';
 function criar(){
  el=document.createElement('div');el.id='fightPing';el.hidden=true;el.setAttribute('role','status');el.title='Latência (ping) com o servidor';
  el.innerHTML=WIFI+'<b>… ms</b>';document.body.appendChild(el);
 }
 function noJogo(){
  try{
   if(!document.body.classList.contains('v46-match'))return false;
   const b=document.getElementById('battle');return !!b&&getComputedStyle(b).display!=='none';
  }catch{return false}
 }
 const visivel=r=>r&&r.width>2&&r.height>2;
 function posicionar(){
  if(!el||el.hidden)return;
  const rect=sel=>{const e=document.querySelector(sel);if(!e)return null;const c=getComputedStyle(e);if(c.display==='none'||c.visibility==='hidden')return null;const r=e.getBoundingClientRect();return visivel(r)?r:null};
  const h=el.offsetHeight||20,w=el.offsetWidth||60,m=rect('#battle .mid-hud'),pa=rect('#pauseBtn'),pl=rect('#battle .fighterhud:not(.enemy)'),en=rect('#battle .fighterhud.enemy');
  let x,y;
  if(pa){x=pa.right+8;y=pa.top+(pa.height-h)/2}                                   // ao lado do botão de pausa (quando existe)
  else if(m){
   y=m.top+Math.min(6,Math.max(0,(m.height-h)/2));
   if(!en||m.right+6+w<=en.left-4)x=m.right+6;                                      // à direita do painel do cronômetro, antes do cartão do rival
   else if(!pl||m.left-6-w>=pl.right+4)x=m.left-6-w;                               // ou à esquerda
   else{x=m.left+(m.width-w)/2;y=m.bottom+3}                                        // sem espaço nos lados: logo abaixo do painel
  }else{x=innerWidth/2+44;y=8}
  x=Math.max(4,Math.min(innerWidth-w-4,x));y=Math.max(2,y);
  el.style.left=Math.round(x)+'px';el.style.top=Math.round(y)+'px';
 }
 function atualizar(){
  if(!el)criar();
  const on=noJogo();
  if(el.hidden===on)el.hidden=!on;
  if(!on)return;
  const rtt=window.OnlineV45&&OnlineV45.state?OnlineV45.state.rtt:null;
  const txt=rtt==null?'… ms':rtt+' ms',q=rtt==null?'ok':rtt<80?'bom':rtt<180?'ok':'ruim';
  const chave=txt+q;
  if(chave!==ultimo){ultimo=chave;el.querySelector('b').textContent=txt;el.dataset.q=q}
  posicionar();
 }
 addEventListener('resize',()=>requestAnimationFrame(posicionar));
 setInterval(atualizar,500);
 window.PingLuta={atualizar,posicionar};
})();
