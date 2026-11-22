'use strict';
/*
 * Fase de teste com amigos (ver js/config_teste.js): efeitos que não dependem de um arquivo só do jogo.
 *  - marca o corpo com a classe "fase-teste" (o CSS esconde moedas, cristais, Loja, Missões e presentes);
 *  - nenhuma partida dá moedas, e os textos de resultado perdem as frases sobre moedas.
 */
(function(){
if(!window.ELDORIA_TESTE_ON||!ELDORIA_TESTE.ativo)return;
document.body.classList.add('fase-teste');
if(ELDORIA_TESTE_ON('semMoedas')){
 try{awardMatchCoins=function(){return 0}}catch{}
 const SEM=/moeda|cristal|giro|Loja/i;
 const limpa=()=>{
  const rt=document.getElementById('resultText');
  if(rt&&SEM.test(rt.textContent))rt.textContent=rt.textContent.split(/(?<=[.!?])\s+/).filter(f=>!SEM.test(f)).join(' ');
  document.querySelectorAll('#stats span').forEach(s=>{if(SEM.test(s.textContent))s.remove()});
 };
 const o=document.getElementById('outcome');
 if(o)new MutationObserver(limpa).observe(o,{childList:true,subtree:true,characterData:true});
}
})();
