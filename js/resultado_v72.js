'use strict';
/*
 * v72 — tela de resultado: organiza o conteúdo que cada modo escreve em #resultTitle / #resultText / #stats (sem mudar quem escreve).
 *  - marca #outcome.derrota quando o título é de derrota (cores mais frias);
 *  - tira do texto o que já aparece nas pílulas ou é ruído ("Renova à meia-noite local.", "Conta: +50 XP.");
 *  - dá a cada pílula um tipo (tempo, dano, xp) para o ícone, e esconde "Sem recompensa".
 */
(function(){
 const out=()=>document.getElementById('outcome');
 let ocupado=false;
 const DERROTA=/novo aprendizado|derrotad|prevaleceu|perdeu|você caiu|tempo esgotado|empate/i;
 function organizar(){
  if(ocupado)return;ocupado=true;
  try{
   const o=out();if(!o)return;
   const t=document.getElementById('resultTitle'),tx=document.getElementById('resultText'),st=document.getElementById('stats');
   if(t)o.classList.toggle('derrota',DERROTA.test(t.textContent));
   if(st){
    const spans=[...st.querySelectorAll('span')];
    for(const s of spans){
     const x=s.textContent;let k='';
     if(/sem recompensa/i.test(x))k='vazio';else if(/XP/i.test(x))k='xp';else if(/\d+\s*s\b.*combate|combate/i.test(x))k='tempo';else if(/dano/i.test(x))k='dano';
     if(s.dataset.k!==k){if(k)s.dataset.k=k;else delete s.dataset.k}
    }
    if(tx&&spans.some(s=>s.dataset.k==='xp')){
     const novo=tx.textContent.replace(/\s*Conta:\s*\+\d+\s*XP\.?/i,'').replace(/\s*Renova à meia-noite local\.?/i,'').replace(/\s{2,}/g,' ').trim();
     if(novo!==tx.textContent)tx.textContent=novo;
    }else if(tx){const novo=tx.textContent.replace(/\s*Renova à meia-noite local\.?/i,'').trim();if(novo!==tx.textContent)tx.textContent=novo}
   }
  }finally{ocupado=false}
 }
 function ligar(){
  const o=out();if(!o)return setTimeout(ligar,500);
  new MutationObserver(()=>organizar()).observe(o,{childList:true,subtree:true,characterData:true});
  organizar();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ligar);else ligar();
 window.ResultadoV72={organizar};
})();
