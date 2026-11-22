'use strict';
/*
 * v70 — ping na luta online: uma pílula pequena (sinal + "45 ms") no canto inferior esquerdo, colada nas bordas e perto do analógico, onde não cobre a arena nem os botões.
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
 // canto inferior esquerdo, colado nas bordas, perto do analógico (sem encostar nele)
 function posicionar(){
  if(!el||el.hidden)return;
  const h=el.offsetHeight||20,w=el.offsetWidth||60,M=6;
  const st=document.getElementById('stick'),cs=st&&getComputedStyle(st);
  const r=st&&cs.display!=='none'&&cs.visibility!=='hidden'?st.getBoundingClientRect():null;
  const cru=(x,y)=>r&&visivel(r)&&x<r.right+3&&x+w>r.left-3&&y<r.bottom+3&&y+h>r.top-3;   // encosta no analógico?
  let x=M,y=innerHeight-h-M;
  if(cru(x,y)){
   const livre=innerHeight-r.bottom;                                                    // espaço embaixo do analógico
   if(livre>=h+4){x=Math.max(M,r.left);y=innerHeight-h-Math.max(M,(livre-h)/2)}
   else{x=r.right+8;y=Math.min(innerHeight-h-M,r.bottom-h)}                               // senão, logo à direita dele
  }
  x=Math.max(2,Math.min(innerWidth-w-2,x));y=Math.max(2,Math.min(innerHeight-h-2,y));
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
