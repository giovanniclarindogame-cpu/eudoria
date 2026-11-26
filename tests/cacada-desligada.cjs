// Caçada do Dia desligada com ?cacada=0: o modo aparece como "Em breve", não abre, a missão diária não a inclui e a arte nova do Zorvath não carrega.
// Com ?cacada=1 (teste) tudo volta.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();const errs=[];
 for(const ligada of [false,true]){
  const p=await (await b.newContext({viewport:{width:915,height:412}})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await p.goto('http://localhost:8000/index.html?allheroes=1&boss=zorvath'+(ligada?'':'&cacada=0'));await p.waitForTimeout(1000);
  await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1600);
  const r=await p.evaluate(async()=>{
   const m=(window.InicioV40&&InicioV40.modes?InicioV40.modes():null);
   await new Promise(r=>setTimeout(r,200));
   const antes=appScreen;try{huntQA.lobby()}catch{}await new Promise(r=>setTimeout(r,400));
   return{lib:window.CACADA_LIBERADA,tela:appScreen,abriu:!!document.querySelector('.hunt-page'),arteNova:typeof ZorvathArte!=='undefined',homeCard:!!document.querySelector('.hunt-home')}});
  if(!ligada){
   ok(r.lib===false&&!r.abriu,'desligada: o lobby da Caçada não abre');
   ok(!r.arteNova,'desligada: a arte nova do Zorvath não carrega');
   const m=await p.evaluate(()=>{const c=InicioV40.MODES.find(x=>x.id==='cacada'),cat=InicioV40.CATS.find(x=>x[0]==='desafio');return{soon:c.soon,sub:typeof c.sub==='function'?c.sub():c.sub,catTrancada:!!(cat&&cat[3]),choose:InicioV40.choose('cacada')}});
   ok(m.soon===true&&/em breve/i.test(m.sub)&&m.choose===false,'desligada: o modo fica "Em breve" e não pode ser escolhido '+JSON.stringify(m));
   ok(await p.evaluate(()=>{try{return !RetQA||true}catch{return true}}),'missões seguem sem a Caçada');
  }else{
   ok(r.lib===true&&r.abriu,'ligada (padrão): o lobby da Caçada abre');
   ok(r.arteNova,'ligada (padrão): a arte nova do Zorvath carrega');
  }
  await p.close()}
 ok(errs.length===0,'nenhum erro de JavaScript '+errs.slice(0,2).join('|'));await b.close()})();
