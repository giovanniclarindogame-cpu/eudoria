/* Modo manutenção (v85): se manutencao.json estiver com "ativo": true, quem abre o jogo vê SÓ esta tela (o jogo nem carrega) e ela
   se atualiza sozinha quando a manutenção acaba. Sem rede, arquivo ausente ou com defeito: o jogo abre normalmente.
   Para testar sem sair da manutenção: abra o jogo com ?semmanut=1.
   Este script é o PRIMEIRO do <head> e usa um pedido síncrono (arquivo minúsculo) justamente para impedir o resto de carregar. */
(function(){
 'use strict';
 if(/[?&]semmanut=1/.test(location.search))return;
 var ARQ='manutencao.json';
 function ler(sincrono,cb){
  var url=ARQ+'?t='+Date.now();
  if(sincrono){
   try{var x=new XMLHttpRequest();x.open('GET',url,false);x.send(null);
    if(x.status===200)return JSON.parse(x.responseText)}catch(e){}
   return null;
  }
  try{fetch(url,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(cb,function(){cb(null)})}catch(e){cb(null)}
 }
 var d=ler(true);
 if(!d||d.ativo!==true)return;
 var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})};
 var titulo=esc(d.titulo||'EM MANUTENÇÃO'),msg=esc(d.mensagem||'Estamos melhorando o jogo. Volte em alguns minutos!'),volta=d.volta?esc(d.volta):'';
 var css='*{box-sizing:border-box}html,body{margin:0;height:100%;background:#0b1130;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}'
 +'.bg{position:fixed;inset:-20px;background:url(assets/inicio_v40/fundo.webp?v=1) center 60%/cover no-repeat;filter:blur(8px) saturate(1.1)}'
 +'.bg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,70,.82),rgba(8,12,40,.94))}'
 +'main{position:relative;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px 20px;text-align:center}'
 +'.g{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;border:3px solid #ffd45a;background:radial-gradient(#2b4cb0,#13225e);box-shadow:0 0 26px rgba(255,212,90,.55)}'
 +'.g svg{width:58px;height:58px;animation:gi 6s linear infinite}@keyframes gi{to{transform:rotate(360deg)}}'
 +'small{letter-spacing:.2em;font-weight:800;font-size:12px;color:#ffe7a3}'
 +'h1{margin:0;font:900 clamp(30px,8vw,54px)/1.05 system-ui;letter-spacing:.08em;color:#ffd45a;text-shadow:0 3px 0 #6a3d00,0 0 24px rgba(255,200,60,.35)}'
 +'p{margin:0;max-width:34ch;font-size:clamp(15px,3.6vw,19px);line-height:1.45;color:#e7eeff;font-weight:600}'
 +'.v{padding:8px 16px;border-radius:999px;border:2px solid rgba(255,212,90,.6);background:rgba(10,18,60,.6);font-weight:700;font-size:14px;color:#ffe7a3}'
 +'button{margin-top:6px;padding:12px 26px;border:2px solid #fff3c2;border-radius:14px;background:linear-gradient(180deg,#ffe066,#f5b800);color:#4a2a00;font:900 16px system-ui;box-shadow:0 4px 0 #8a5a00;cursor:pointer}button:active{transform:translateY(2px);box-shadow:0 2px 0 #8a5a00}'
 +'em{font-style:normal;font-size:12px;color:#aebbe6;min-height:1.2em}'
 +'@media (max-height:430px){main{gap:7px;padding:10px}.g{width:58px;height:58px}.g svg{width:36px;height:36px}p{max-width:60ch}}';
 var gear='<svg viewBox="0 0 32 32" fill="none" stroke="#ffd45a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="4.2"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8"/></svg>';
 var corpo='<div class="bg"></div><main id="manut" role="status" aria-live="polite"><div class="g">'+gear+'</div><small>ELDORIA · ARENA DOS CAMPEÕES</small><h1>'+titulo+'</h1><p>'+msg+'</p>'
 +(volta?'<div class="v">Previsão de volta: <b>'+volta+'</b></div>':'')
 +'<button id="manutVer" type="button">Verificar agora</button><em id="manutSt">Esta tela se atualiza sozinha.</em></main>';
 window.__MANUTENCAO=true;
 // para o carregamento do jogo e SUBSTITUI a página. (document.write dentro do <head> não substitui nada e o jogo seguiria carregando;
 // document.open depois do stop deixa a página sem desenhar; trocar o innerHTML do documento funciona.)
 try{window.stop()}catch(e){}
 document.documentElement.innerHTML='<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0b1130"><meta name="robots" content="noindex"><title>Eldoria · em manutenção</title><style>'+css+'</style></head><body>'+corpo+'</body>';
 var st=function(t){var e=document.getElementById('manutSt');if(e)e.textContent=t};
 function checar(manual){
  if(manual)st('Verificando…');
  ler(false,function(r){
   if(r&&r.ativo===false){st('Voltamos! Abrindo o jogo…');location.reload();return}
   if(manual)st(r?'Ainda em manutenção. Tente de novo daqui a pouco.':'Sem conexão no momento. Tente de novo.');
  });
 }
 var b=document.getElementById('manutVer');if(b)b.addEventListener('click',function(){checar(true)});
 setInterval(function(){checar(false)},30000);
})();
