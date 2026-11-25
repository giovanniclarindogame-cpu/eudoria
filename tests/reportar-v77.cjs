// Botão "Reportar bug" na luta: aparece abaixo do tempo sem cobrir nada, abre a janela, pausa (offline), envia relatório + foto,
// o servidor guarda tudo (e a foto só sai com a chave), e se o servidor recusar a foto o relatório vai sem ela.
const { chromium } = require('playwright');const { spawn } = require('child_process');const path=require('path'),fs=require('fs'),os=require('os');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PORT=8798,SRV='ws://localhost:'+PORT,CHAVE='chave-de-teste-v77',DADOS=fs.mkdtempSync(path.join(os.tmpdir(),'fb77-'));
(async()=>{
 const sv=spawn('node',['servidor.cjs'],{cwd:path.join(__dirname,'..','servidor'),env:{...process.env,PORT:String(PORT),TESTE:'1',AQUECIDAS:'1',DADOS,FEEDBACK_CHAVE:CHAVE},stdio:'ignore'});
 for(let i=0;i<40;i++){try{await fetch('http://localhost:'+PORT+'/saude');break}catch{await sleep(250)}}
 const br=await chromium.launch();const errs=[];
 const novo=async()=>{const p=await (await br.newContext({viewport:{width:1000,height:450},deviceScaleFactor:2})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await p.goto('http://localhost:8000/index.html?allheroes=1&servidor='+encodeURIComponent(SRV));await p.waitForTimeout(900);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Giovanni');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);return p};
 let p=await novo();
 await p.evaluate(()=>{matchMode='1v1';battleActivity='duel';account.activeChampion=2;selected=[...CHAMPIONS[2].kit];start()});
 await p.waitForFunction(()=>state==='count'||state==='fight',null,{timeout:25000});await p.evaluate(()=>{state='fight';count=0;document.querySelector('#intro73')?.remove()});await p.waitForTimeout(900);
 const g=await p.evaluate(()=>{const b=document.querySelector('#bugBtn77'),t=document.querySelector('#timer');if(!b)return null;const a=b.getBoundingClientRect(),c=t.getBoundingClientRect();
  const alvos=[...document.querySelectorAll('.fighterhud,#crownStrip .cs-card,.hud-menu')].filter(e=>e.offsetParent&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0).map(e=>e.getBoundingClientRect());
  return{abaixo:a.top>=c.bottom-1&&a.left<c.right,dentro:a.top>=0&&a.bottom<=innerHeight&&a.left>=0&&a.right<=innerWidth,larg:Math.round(a.width),alt:Math.round(a.height),cobre:alvos.some(r=>!(a.right<r.left||a.left>r.right||a.bottom<r.top||a.top>r.bottom))}});
 ok(g&&g.abaixo&&g.dentro&&!g.cobre,'botão 🐞 está logo abaixo do tempo, dentro da tela e sem cobrir o HUD '+JSON.stringify(g));
 await p.screenshot({path:'/tmp/claude-0/rep_botao.png',clip:{x:300,y:0,width:400,height:140}});
 await p.click('#bugBtn77');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>!!document.querySelector('#bug77')&&state==='paused'),'tocar abre a janela e pausa a luta (offline)');
 await p.screenshot({path:'/tmp/claude-0/rep_janela.png'});
 // 1ª tentativa: o servidor "antigo" recusa corpo grande (derruba a conexão) → o jogo reenvia sem a foto
 let bloqueou=0,tamanhos=[];
 await p.route(/feedback\/enviar/,async r=>{const n=(r.request().postData()||'').length;tamanhos.push(n);if(n>10000&&!bloqueou){bloqueou=1;return r.abort()}r.continue()});
 await p.fill('#bug77 textarea','a arena ficou pequena no começo');await p.click('[data-b77=enviar]');
 await p.waitForFunction(()=>/Relatório enviado/.test(document.querySelector('#bug77')?.textContent||''),null,{timeout:15000});
 ok(bloqueou===1&&tamanhos.length===2&&tamanhos[1]<tamanhos[0],`servidor que recusa foto: reenviou sem ela (${tamanhos.join(' → ')} bytes)`);
 await p.unroute(/feedback\/enviar/);
 await p.click('[data-b77=x]');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>!document.querySelector('#bug77')&&state==='fight'),'depois de enviar, "Voltar à luta" fecha e retoma a luta');
 await sleep(16000);
 // 2º envio completo (com foto)
 await p.click('#bugBtn77');await p.waitForTimeout(200);await p.click('[data-b77=enviar]');
 await p.waitForFunction(()=>/Relatório enviado/.test(document.querySelector('#bug77')?.textContent||''),null,{timeout:15000});
 const lista=await (await fetch('http://localhost:'+PORT+'/feedback/ler?k='+CHAVE)).json();
 const [novo2,antigo]=lista.itens;
 ok(lista.total>=2&&antigo&&/\[PARTIDA\].*arena ficou pequena/.test(antigo.texto)&&antigo.tipo==='bug','o servidor guardou o relatório como bug com a descrição do jogador');
 let rel;try{rel=JSON.parse(antigo.relatorio)}catch{}
 ok(rel&&rel.partida.estado&&rel.arena&&rel.arena.matriz.length===6&&rel.arena.escala>0&&rel.lutadores.length===2&&rel.aparelho.tela&&Array.isArray(rel.eventos)&&rel.eventos.length>0,'relatório tem partida, arena/câmera/matriz, lutadores, aparelho e eventos '+(rel?Object.keys(rel).join(','):'sem relatório'));
 ok(!antigo.captura,'o reenvio sem foto não tem captura');
 ok(!!novo2.captura,'o envio completo guardou uma foto da arena');
 const semChave=await fetch('http://localhost:'+PORT+'/feedback/captura/'+novo2.captura+'.jpg');const comChave=await fetch('http://localhost:'+PORT+'/feedback/captura/'+novo2.captura+'.jpg?k='+CHAVE);const buf=Buffer.from(await comChave.arrayBuffer());
 ok(semChave.status===403&&comChave.status===200&&buf[0]===0xff&&buf[1]===0xd8,`a foto só abre com a chave (${semChave.status} sem, ${comChave.status} com, ${buf.length} bytes, JPEG)`);
 fs.writeFileSync('/tmp/claude-0/rep_foto.jpg',buf);
 // Disputa da Coroa: o relatório diz que é coroa
 await p.evaluate(()=>leave());await p.waitForTimeout(300);
 await p.evaluate(()=>{account.activeChampion=2;selected=[...CHAMPIONS[2].kit];V3Crown.begin()});await p.waitForFunction(()=>V3Crown.state.on&&(state==='count'||state==='fight'),null,{timeout:25000});await p.waitForTimeout(500);
 const rc=await p.evaluate(()=>ReportarV77.montar());ok(rc.partida.coroa===true&&rc.lutadores.length===4,'na Disputa da Coroa o relatório marca coroa e traz os 4 lutadores');
 const gc=await p.evaluate(()=>{const b=document.querySelector('#bugBtn77').getBoundingClientRect();return[...document.querySelectorAll('#crownStrip .cs-card')].some(e=>{const r=e.getBoundingClientRect();return !(b.right<=r.left+1||b.left>=r.right-1||b.bottom<=r.top+1||b.top>=r.bottom-1)})});
 ok(!gc,'na Coroa o botão não cobre o placar dos 4 lutadores');
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));
 await br.close();sv.kill();fs.rmSync(DADOS,{recursive:true,force:true})})();
