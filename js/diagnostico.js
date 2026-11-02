(function(){
  'use strict';
  let started=Date.now();
  const errors=[];
  const log=(value)=>{
    if(errors.length>8)errors.shift();
    errors.push(String(value));
    window.eldoriaErros=errors;
    console.error('[Eldoria diagnóstico]',value);
    const overlay=document.getElementById('integrationLoading');
    if(!overlay || (window.integrationQA&&window.integrationQA.ready))return;
    overlay.hidden=false;
    const pre=document.getElementById('errorDetalle')||document.createElement('pre');
    pre.id='errorDetalle';pre.style.cssText='white-space:pre-wrap;max-width:min(95vw,670px);overflow-wrap:anywhere;color:#ffb6a6;font-size:11px;text-align:left;max-height:40vh;overflow:auto';
    pre.textContent=errors.join('\n');
    overlay.appendChild(pre);
  };
  window.addEventListener('error',e=>{
    if(e.error)log(e.error.stack||e.message);
    else if(e.target && e.target.tagName==='SCRIPT')log('Não foi possível abrir '+e.target.src);
  },true);
  window.addEventListener('unhandledrejection',e=>log(e.reason?.stack||e.reason));
  window.addEventListener('load',()=>{
    setTimeout(()=>{
      if(window.integrationQA?.ready){document.getElementById('integrationLoading')?.remove();return}
      const overlay=document.getElementById('integrationLoading');
      if(overlay){
        const stage=document.getElementById('bootStage');if(stage)stage.textContent='A inicialização não foi concluída. Veja as informações abaixo.';
        if(!errors.length)log('Inicialização pendente por mais de 12 segundos. Execute INICIAR_JOGO_WINDOWS.bat ou examine o Console do navegador (F12).');
      }
    },12000);
  });
})();
