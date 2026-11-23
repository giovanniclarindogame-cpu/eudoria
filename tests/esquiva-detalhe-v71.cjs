// Tela do campeão: o botão "Esquiva" existe nos 10 campeões, abre a descrição certa, e o texto cabe na caixa (celular) sem rolar.
const { chromium } = require('playwright');
const ok=(c,m)=>{if(!c){console.error('FALHOU:',m);process.exitCode=1}else console.log('ok  -',m)};
(async()=>{const b=await chromium.launch();
 for(const [w,h,mob] of [[915,412,true],[667,375,true],[1280,720,false]]){
  const tag=`${w}x${h}`;const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('x'))});
  await p.goto('http://localhost:8000/index.html');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('#profileName','Teste');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1800);
  await p.evaluate(()=>{const b=document.querySelector('[data-tut-go]');if(b){let e=b;while(e.parentElement&&getComputedStyle(e).position!=='fixed')e=e.parentElement;e.style.display='none'}});
  await p.evaluate(()=>showScreen('library'));await p.waitForTimeout(500);
  const falhas=[];let nomes=[];
  for(let id=0;id<10;id++){
   await p.evaluate(i=>openChampionDetails(i),id);await p.waitForTimeout(400);
   const r=await p.evaluate(()=>{const e=document.querySelector('#heroDetail [data-hero-esquiva]');return{tem:!!e,rotulo:e?.querySelector('small')?.textContent,ult:[...document.querySelectorAll('#heroDetail .hero-kit>button')].map(x=>x.dataset.heroSkill||(x.dataset.heroEsquiva?'esq':'?')).join(',')}});
   if(!r.tem){falhas.push(`${id}: sem botão`);continue}
   await p.evaluate(()=>document.querySelector('#heroDetail [data-hero-esquiva]').click());await p.waitForTimeout(150);
   const c=await p.evaluate(()=>{const t=document.getElementById('heroSkillCopy'),e=document.querySelector('#heroDetail [data-hero-esquiva]'),nv=document.querySelector('#heroDetail .nv-box');return{txt:t.innerText.replace(/\s+/g,' ').trim(),ativo:e.classList.contains('active')&&e.getAttribute('aria-pressed')==='true',sobra:t.scrollHeight-t.clientHeight,sobrepoe:nv?t.getBoundingClientRect().bottom>nv.getBoundingClientRect().top+1:false,outrosAtivos:document.querySelectorAll('#heroDetail [data-hero-skill].active').length}});
   nomes.push(c.txt.split('·')[1]?.trim().split(' ').slice(0,2).join(' '));
   if(!/^ESQUIVA · /.test(c.txt))falhas.push(`${id}: texto não começa com ESQUIVA (${c.txt.slice(0,40)})`);
   if(!/recarga/.test(c.txt)||!/invulnerável/.test(c.txt))falhas.push(`${id}: faltam recarga/invulnerável`);
   if(!c.ativo||c.outrosAtivos)falhas.push(`${id}: estado ativo errado`);
   if(mob&&(c.sobra>1||c.sobrepoe))falhas.push(`${id}: texto não cabe (sobra ${c.sobra}px${c.sobrepoe?', sobrepõe o nível':''})`);
   // voltar para uma habilidade desativa a esquiva
   await p.evaluate(()=>document.querySelector('#heroDetail [data-hero-skill]').click());await p.waitForTimeout(100);
   const v=await p.evaluate(()=>({esq:document.querySelector('#heroDetail [data-hero-esquiva]').classList.contains('active'),txt:document.getElementById('heroSkillCopy').innerText.slice(0,8)}));
   if(v.esq||/^ESQUIVA/.test(v.txt))falhas.push(`${id}: clicar numa habilidade não tirou a esquiva`);
  }
  ok(falhas.length===0,`${tag}: os 10 campeões têm o botão Esquiva com a descrição certa${falhas.length?' — '+falhas.slice(0,4).join(' | '):''} [${nomes.join(', ')}]`);
  if(w===915){   // o ícone da esquiva é o MESMO do botão de dash da batalha
   const dif=[];
   for(let id=0;id<10;id++){
    await p.evaluate(()=>{try{leave()}catch{}showScreen('library')});await p.waitForTimeout(150);
    const bat=await p.evaluate(i=>{matchMode='1v1';battleActivity='training';account.activeChampion=i;selected=[...CHAMPIONS[i].kit];start();state='fight';count=0;try{V3Relayout()}catch{}return document.getElementById('attack').innerHTML.split('<small>')[0].replace(/\s+/g,' ')},id);
    await p.evaluate(()=>{leave();showScreen('library')});await p.waitForTimeout(150);
    await p.evaluate(i=>openChampionDetails(i),id);await p.waitForTimeout(250);
    const det=await p.evaluate(()=>document.querySelector('#heroDetail [data-hero-esquiva]').innerHTML.split('<small>')[0].replace(/\s+/g,' '));
    if(!(bat===det||(/v3-arrow/.test(bat)&&/esq-seta/.test(det))))dif.push(id);
   }
   ok(dif.length===0,`${tag}: o ícone da esquiva é o mesmo do botão de dash da batalha nos 10 campeões${dif.length?' — diferem: '+dif.join(','):''}`);
  }
  ok(errs.length===0,`${tag}: sem erros de JavaScript ${errs.slice(0,2).join('|')}`);
  if(w===915){await p.evaluate(()=>openChampionDetails(1));await p.waitForTimeout(400);await p.evaluate(()=>document.querySelector('#heroDetail [data-hero-esquiva]').click());await p.waitForTimeout(200);await p.screenshot({path:'/tmp/claude-0/esq_cel.png'})}
  await ctx.close();
 }
 await b.close()})();
