integrationBoot().catch(err=>{
 const el=$('#integrationLoading');
 console.error('[Eldoria] Falha de inicialização:',err);
 if(el){el.hidden=false;el.innerHTML='<h2>Erro ao iniciar a Arena</h2><p id="arenaBootError" style="white-space:pre-wrap;max-width:650px;word-break:break-word;color:#ffc2b7">'+String(err?.stack||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).slice(0,1600)+'</p><button type="button" onclick="location.reload()" style="margin-top:20px;padding:12px 20px;background:#e8c787;color:#18241d;border-radius:7px">Recarregar</button>';}
});
