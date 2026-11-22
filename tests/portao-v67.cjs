// Portão do jogo: login por cookie (sem janela de senha do navegador), arquivos protegidos, remoção na hora, WebSocket e API abertos.
const { chromium } = require('playwright');const { spawn, execFileSync } = require('child_process');const path=require('path'),os=require('os'),fs=require('fs');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8796,B='http://localhost:'+PORT,RAIZ=path.join(__dirname,'..');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'portao-')),ACESSOS=path.join(tmp,'usuarios.txt'),DADOS=path.join(tmp,'dados');
 const env={...process.env,PORT:String(PORT),SITE:RAIZ,ACESSOS,DADOS,TESTE:'1',AQUECIDAS:'1'};
 const amigos=(...a)=>execFileSync('node',['amigos.cjs',...a],{cwd:path.join(RAIZ,'servidor'),env}).toString();
 const out=amigos('add','victor','joao','x y','victor');
 const senha=n=>new RegExp('usuário: '+n+'\\nsenha:   (\\w+)').exec(out)[1];
 ok(/Criados: 2/.test(out)&&/inválido/.test(out)&&/Já existe/.test(out),'amigos.cjs cria 2 acessos, pula nome inválido e repetido');
 ok(!fs.readFileSync(ACESSOS,'utf8').includes(senha('victor')),'a senha não fica guardada em texto (só o hash)');
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(RAIZ,'servidor'),env,stdio:'ignore'});
 for(let i=0;i<40;i++){try{await fetch(B+'/saude');break}catch{await sleep(250)}}
 const get=(p,o={})=>fetch(B+p,{redirect:'manual',...o});
 // sem entrar
 let r=await get('/',{headers:{accept:'text/html'}});ok(r.status===303&&/\/entrar/.test(r.headers.get('location')),'sem login: a página inicial manda para /entrar');
 r=await get('/js/jogo.js');ok(r.status===401,'sem login: arquivo do jogo dá 401 (sem janela de senha do navegador)');ok(!r.headers.get('www-authenticate'),'nunca envia o desafio WWW-Authenticate (é ele que faz o navegador pedir senha no meio da partida)');
 r=await get('/assets/manifest.json');ok(r.status===401,'sem login: imagens/assets também protegidos');
 r=await get('/saude');ok(r.status===200&&(await r.json()).ok,'/saude continua aberto');
 r=await fetch(B+'/conta/criar',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});ok(r.status!==401&&r.status!==303,'API /conta continua aberta');
 r=await get('/robots.txt');ok(/Disallow: \//.test(await r.text()),'robots.txt pede para não indexar');
 // senha errada
 const post=(u,s)=>get('/entrar',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({u,s,next:'/'}).toString()});
 r=await post('victor','errada');ok(r.status===401&&!r.headers.get('set-cookie'),'senha errada: 401 e sem cookie');
 r=await post('fantasma','qualquer');ok(r.status===401,'usuário inexistente: 401');
 // certo
 r=await post('victor',senha('victor'));const ck=(r.headers.get('set-cookie')||'').split(';')[0];
 ok(r.status===303&&/^eldoria_s=/.test(ck)&&/HttpOnly/.test(r.headers.get('set-cookie')),'senha certa: cookie HttpOnly e redireciona');
 const com={headers:{cookie:ck}};
 r=await get('/',{headers:{cookie:ck,accept:'text/html'}});ok(r.status===200&&/<title>/.test(await r.text()),'com cookie: abre o jogo');
 r=await get('/js/jogo.js',com);ok(r.status===200&&/javascript/.test(r.headers.get('content-type')),'com cookie: entrega os scripts');
 const et=r.headers.get('etag');r=await get('/js/jogo.js',{headers:{cookie:ck,'if-none-match':et}});ok(r.status===304,'cache: 304 quando não mudou');
 r=await get('/assets/manifest.json',com);ok(r.status===200,'com cookie: entrega assets');
 for(const p of ['/servidor/servidor.cjs','/servidor/dados/x','/tests/portao-v67.cjs','/.git/config','/LEIA-ME_V11.txt','/js/../servidor/servidor.cjs','/%2e%2e/servidor/servidor.cjs','/js/%2e%2e/%2e%2e/etc/passwd','/assets//../../etc/passwd'])
  {r=await get(p,com);ok(r.status===404||r.status===400,`bloqueado mesmo logado: ${p} (${r.status})`)}
 r=await get('/js/jogo.js',{headers:{cookie:ck.slice(0,-3)+'xxx'}});ok(r.status===401,'cookie adulterado é recusado');
 // remover = corta na hora
 amigos('remover','victor');
 r=await get('/js/jogo.js',com);ok(r.status===401,'amigo removido: o cookie para de valer na hora');
 ok(/joao/.test(amigos('lista'))&&!/victor/.test(amigos('lista')),'lista mostra só quem tem acesso');
 // limite de tentativas
 let bloq=false;for(let i=0;i<12;i++){const x=await post('joao','errada'+i);if(x.status===429){bloq=true;break}}
 ok(bloq,'muitas senhas erradas seguidas: bloqueia por uns minutos');
 sv.kill();await sleep(500);
 // ---- arquivo dos amigos ilegível (ex.: sem permissão) NÃO pode derrubar o servidor ----
 {const ruim=path.join(tmp,'ruim');fs.mkdirSync(ruim);   // uma pasta no lugar do arquivo: ler dá erro, como o EACCES da VPS
  const env3={...env,ACESSOS:ruim,PORT:String(PORT+1)};const sv3=spawn('node',['servidor.cjs'],{cwd:path.join(RAIZ,'servidor'),env:env3,stdio:'ignore'});
  for(let i=0;i<40;i++){try{await fetch('http://localhost:'+(PORT+1)+'/saude');break}catch{await sleep(250)}}
  const a=await fetch('http://localhost:'+(PORT+1)+'/js/jogo.js',{redirect:'manual'});await sleep(300);
  const b2=await fetch('http://localhost:'+(PORT+1)+'/saude');
  ok(a.status===401&&b2.status===200,'arquivo dos amigos ilegível: o servidor continua no ar (ninguém entra, mas as partidas seguem)');sv3.kill();}

 // ---- navegador de verdade: login pela página e o jogo abre e conecta ----
 const out2=amigos('add','ana');const senhaAna=/senha:   (\w+)/.exec(out2)[1];
 const sv2=spawn('node',['servidor.cjs'],{cwd:path.join(RAIZ,'servidor'),env,stdio:'ignore'});
 for(let i=0;i<40;i++){try{await fetch(B+'/saude');break}catch{await sleep(250)}}
 const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:900,height:420}});const pg=await ctx.newPage();
 const errs=[],dialogos=[],falhas=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dialogos.push(d.message());d.dismiss()});
 pg.on('response',x=>{if(x.status()>=400&&!/favicon|\/entrar/.test(x.url()))falhas.push(x.status()+' '+x.url().replace(B,''))});
 await pg.goto(B+'/?allheroes=1&servidor='+encodeURIComponent('ws://localhost:'+PORT));
 ok(/\/entrar/.test(pg.url()),'navegador: sem login cai na página de login');
 await pg.fill('#u','ana');await pg.fill('#s','errada');await pg.click('button[type=submit]');
 ok(/incorretos/.test(await pg.textContent('body')),'navegador: senha errada mostra o aviso');
 await pg.fill('#u','ana');await pg.fill('#s',senhaAna);await Promise.all([pg.waitForNavigation(),pg.click('button[type=submit]')]);
 await pg.waitForFunction(()=>window.arenaQA,null,{timeout:30000});
 ok(!/\/entrar/.test(pg.url()),'navegador: depois do login o jogo abre');
 ok(await pg.evaluate(()=>!!document.querySelector('#welcomeEnter')),'navegador: a tela inicial do jogo aparece');
 await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName','Ana');await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2000);
 await pg.evaluate(()=>document.querySelector('#ljModal')?.remove());
 await pg.evaluate(()=>{InicioV40.choose('duelo');showScreen('home')});await sleep(400);await pg.click('[data-v40-play]');
 await pg.waitForFunction(()=>OnlineV45.state.procurando||OnlineV45.state.fase==='sala',null,{timeout:30000});
 ok(true,'navegador: a busca de partida conecta ao servidor (WebSocket) sem pedir senha');
 // recarregar a página mantém o login; sair volta ao login
 await pg.reload();await pg.waitForFunction(()=>window.arenaQA,null,{timeout:30000});ok(!/\/entrar/.test(pg.url()),'navegador: recarregar mantém o login (cookie)');
 ok(dialogos.length===0,'nenhuma janela/diálogo do navegador apareceu');
 ok(falhas.length===0,'nenhum arquivo do jogo falhou ao carregar '+falhas.slice(0,5).join(', '));
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3).join('|'));
 await pg.goto(B+'/sair');ok(/\/entrar/.test(pg.url()),'/sair volta ao login');
 await br.close();sv2.kill();fs.rmSync(tmp,{recursive:true,force:true});
})();
