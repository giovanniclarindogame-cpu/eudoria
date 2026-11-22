// Conta com código: criar/entrar/salvar (API), conflito de versões, persistência depois de reiniciar o servidor, conferência de campeões nas partidas,
// janela "Minha conta" e restauração em outro aparelho.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path');const fs=require('fs');const os=require('os');const WebSocket=require('../servidor/node_modules/ws');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8799,HTTP='http://localhost:'+PORT,SRV='ws://localhost:'+PORT;
const DADOS=fs.mkdtempSync(path.join(os.tmpdir(),'eldoria-contas-'));
let sv,svlog='';
function subir(){sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),DADOS,AQUECIDAS:'1',ESPERA_BOT:'60000',FASE_TESTE:'0'},stdio:['ignore','pipe','pipe']});sv.stdout.on('data',d=>svlog+=d);sv.stderr.on('data',d=>svlog+=d)}
async function esperar(){for(let i=0;i<40;i++){try{await fetch(HTTP+'/saude');return}catch{await sleep(250)}}}
const post=async(r,b)=>{const x=await fetch(HTTP+r,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});return{status:x.status,...(await x.json().catch(()=>({})))}};
(async()=>{
 subir();await esperar();
 const conta={profile:{name:'Teste',avatar:0,skin:0},coins:555,crystals:3,ownedHeroes:[3],champions:[3],owned:[],progVer:3};
 const ch={'eldoria-champions-v1':JSON.stringify(conta)};
 /* ---- API ---- */
 const c=await post('/conta/criar',{chaves:ch});
 ok(c.status===200&&/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(c.codigo)&&c.versao===1,`criar devolve um código no formato certo (${c.codigo})`);
 const e1=await post('/conta/entrar',{codigo:c.codigo.toLowerCase().replace(/-/g,' ')});
 ok(e1.status===200&&JSON.parse(e1.chaves['eldoria-champions-v1']).coins===555,'entrar com o código (minúsculo, sem hífen) devolve o progresso');
 ok((await post('/conta/entrar',{codigo:'AAAA-BBBB-CCCC-DDDD'})).status===404,'código errado: 404');
 conta.coins=999;const s1=await post('/conta/salvar',{codigo:c.codigo,chaves:{'eldoria-champions-v1':JSON.stringify(conta)},base:1});
 ok(s1.status===200&&s1.versao===2,'salvar com a versão certa sobe a versão (2)');
 const s2=await post('/conta/salvar',{codigo:c.codigo,chaves:{'eldoria-champions-v1':JSON.stringify({...conta,coins:1})},base:1});
 ok(s2.status===409&&s2.versao===2&&JSON.parse(s2.chaves['eldoria-champions-v1']).coins===999,'salvar com versão antiga (outro aparelho gravou antes): 409 com os dados mais novos');
 ok((await post('/conta/criar',{chaves:{'eldoria-champions-v1':'x'.repeat(200000)}})).status===400,'pacote grande demais é recusado');
 ok(JSON.stringify((await fetch(HTTP+'/saude').then(r=>r.json())).contas)==='1','a /saude mostra o total de contas');
 /* ---- persistência ---- */
 await sleep(2200);sv.kill();await sleep(600);subir();await esperar();
 const e2=await post('/conta/entrar',{codigo:c.codigo});
 ok(e2.status===200&&e2.versao===2&&JSON.parse(e2.chaves['eldoria-champions-v1']).coins===999,'depois de reiniciar o servidor a conta continua lá (arquivo salvo)');
 ok(!fs.readFileSync(path.join(DADOS,'contas.json'),'utf8').includes(c.codigo),'o código não é guardado em texto no arquivo (só o hash)');
 /* ---- campeões liberados nas partidas ---- */
 const entrarWS=(cod,hero)=>new Promise(res=>{const ws=new WebSocket(SRV);const got=[];ws.on('open',()=>ws.send(JSON.stringify({t:'hello',v:3,build:2,conta:cod,p:{name:'Raw',hero,lv:1,tier:0,league:'Bronze'}})));
  ws.on('message',d=>{const m=JSON.parse(d);if(m.t==='hello')ws.send(JSON.stringify({t:'fila',modo:'1v1',p:{name:'Raw',hero,lv:1,tier:0,league:'Bronze'}}));if(m.t==='match')res({ws,m})});});
 const livres=require('../servidor/contas.cjs').livresDaSemana(Date.now());
 const naoLiberado=[0,1,2,3,4,5,6,7,8,9].find(h=>h!==3&&!livres.includes(h));
 const [r1,r2]=await Promise.all([entrarWS(c.codigo,naoLiberado),entrarWS(null,9)]);
 ok(r1.m.gh!==naoLiberado&&(r1.m.gh===3||livres.includes(r1.m.gh)),`o servidor troca um campeão que a conta não tem (${naoLiberado}) por um liberado (${r1.m.gh})`);
 ok(r2.m.gh===9,'sem conta vale o que o jogador mandou (compatível com o jogo antigo)');
 r1.ws.close();r2.ws.close();await sleep(500);
 const [r3,r4]=await Promise.all([entrarWS(c.codigo,3),entrarWS(null,0)]);
 ok(r3.m.gh===3,'um campeão comprado (3) continua valendo');
 r3.ws.close();r4.ws.close();
 /* ---- navegador ---- */
 const br=await chromium.launch();const errs=[];
 async function pagina(c2,nome){const pg=await c2.newPage();pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8000/index.html?semcarga=1&servidor='+encodeURIComponent(SRV));await pg.waitForTimeout(900);
  if(nome){await pg.getByText('ENTRAR',{exact:true}).click();await pg.fill('#profileName',nome);await pg.getByText('Continuar',{exact:true}).click();await pg.waitForTimeout(2200);await pg.getByText('Pular',{exact:true}).click({timeout:1500}).catch(()=>{});await pg.evaluate(()=>document.querySelector('#ljModal')?.remove())}
  return pg}
 const cx=await br.newContext({viewport:{width:900,height:480}});const A=await pagina(cx,'Giovanni');
 await A.evaluate(()=>document.querySelector('[data-v40-menu]').click());await A.waitForTimeout(300);
 ok(await A.evaluate(()=>!!document.querySelector('[data-v40-go="conta"]')),'o Menu tem "Minha conta"');
 await A.evaluate(()=>document.querySelector('[data-v40-go="conta"]').click());await A.waitForTimeout(400);
 ok(await A.evaluate(()=>!!document.querySelector('[data-conta-criar]')&&/neste aparelho/.test(document.querySelector('#v55Conta').textContent)),'sem conta, a janela explica e oferece "Criar minha conta"');
 await A.evaluate(()=>document.querySelector('[data-conta-criar]').click());await A.waitForTimeout(1500);
 const cod=await A.evaluate(()=>document.querySelector('.conta-codigo')?.textContent);
 ok(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(cod||'')&&await A.evaluate(c=>ContaSrv.codigo()===c,cod),`criar mostra o código grande (${cod}) e guarda no aparelho`);
 await A.evaluate(()=>{account.coins=4321;saveAccount()});
 const sinc=await A.evaluate(()=>ContaSrv.sincronizar());ok(sinc==='salvo','uma mudança (moedas) é enviada ao servidor sozinha ('+sinc+')');
 ok((await post('/conta/entrar',{codigo:cod})).status===200,'o servidor reconhece o código novo');
 // outro aparelho
 const cy=await br.newContext({viewport:{width:900,height:480}});const B=await pagina(cy,null);
 await B.waitForTimeout(500);
 await Promise.all([B.waitForNavigation({timeout:15000}).catch(()=>{}),B.evaluate(c=>ContaSrv.entrarComCodigo(c),cod)]);
 await B.waitForTimeout(2500);
 const rest=await B.evaluate(()=>{try{const a=JSON.parse(localStorage.getItem('eldoria-champions-v1'));return{coins:a.coins,nome:a.profile&&a.profile.name}}catch{return null}});
 ok(rest&&rest.coins===4321&&rest.nome==='Giovanni',`em outro aparelho, entrar com o código traz o progresso (${JSON.stringify(rest)})`);
 // conta criada sozinha ao procurar partida online (sem ?allheroes)
 const cz=await br.newContext({viewport:{width:900,height:480}});const C=await pagina(cz,'Procura');
 await C.evaluate(()=>{InicioV40.choose('duelo');showScreen('home')});await C.waitForTimeout(400);await C.click('[data-v40-play]');await C.waitForTimeout(3500);
 ok(await C.evaluate(()=>ContaSrv.tem()),'ao procurar uma partida online a conta é criada sozinha');
 await C.evaluate(()=>OnlineV45.cancelar());
 ok((await fetch(HTTP+'/saude').then(r=>r.json())).contas===3,'o servidor tem 3 contas (API, janela e busca)');
 ok(errs.length===0,'sem erros de JavaScript '+errs.slice(0,3).join(' | '));
 if(process.exitCode)console.log(svlog.slice(-500));
 await br.close();sv.kill();fs.rmSync(DADOS,{recursive:true,force:true});
})();
