'use strict';
/*
 * v73 — polimento de combate e telas (um módulo só, carrega por último; ?polir=0 desliga):
 *  COMBATE  números de dano por força (cor + "pop"), pausa/tremor extra em golpe enorme, aviso padrão (!) quando o rival
 *           prepara um golpe, causa do dano que você levou (pelas costas, guarda quebrada, sem stamina…),
 *           esquiva perfeita para todos (recupera stamina e recarga), medidor extra no treino.
 *  TELAS    apresentação da luta (1,5 s, toque pula), controles ajustáveis (tamanho, mover, inverter lados) no menu de pausa,
 *           resumo de uma linha + barra de XP na tela de resultado, aviso "A arena travou" com Reiniciar luta,
 *           mensagens de espera na fila online.
 */
(function(){
if(/[?&]polir=0/.test(location.search)||typeof hit!=='function'||typeof step!=='function')return;
const $q=s=>document.querySelector(s),LS='eldoria_v73';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const S={n:0,lastClock:1e9,backDealt:0,backTaken:0,perfect:0,maxHit:0,causeAt:-9,xp0:null,erros:[],falhaAt:0,aviso:0};
window.PolimentoV73={S};
const safe=(f)=>{try{return f()}catch(e){try{console.warn('[v73]',e)}catch{}}};
const ehRonin=a=>{try{return a.kit.join()===CHAMPIONS[2].kit.join()}catch{return false}};
const champOf=a=>{try{const k=(a.kit||[]).join();const c=CHAMPIONS.find(c=>c.kit.join()===k);return c?c.name:''}catch{return''}};

/* ================= COMBATE ================= */
const prevHit=hit;
hit=function(t,n,o,k,an,id){
  let perfeita=false;
  if(state==='fight'&&o&&t&&t._dashAt!==undefined&&clock-t._dashAt<.14&&t.inv>0&&!t._dp73&&t.hp>0&&n>0&&!sameTeam(t,o)&&!ehRonin(t))perfeita=true;
  const hp0=t?t.hp:0,t0=texts.length;
  const r=prevHit.apply(this,arguments);
  safe(()=>{
    if(perfeita&&!r){
      t._dp73=true;t.st=Math.min(100,t.st+20);t.dodgeCD=Math.min(t.dodgeCD,.8);if(t.v3dashCD>0)t.v3dashCD=Math.min(t.v3dashCD,.6);for(const i of (t._dashCd||[]))t.cd[i]*=.4;
      float(t.x,t.y-62,'ESQUIVA PERFEITA','#7fe8ff');ring(t.x,t.y,40,'#7fe8ff',.35);
      if(t===p){S.perfect++;combatImpact(1.0)}
    }
    if(!r||state!=='fight')return;
    const dano=Math.max(0,hp0-t.hp);if(dano<=0)return;
    // número de dano por força
    for(let i=texts.length-1;i>=t0&&i>=0;i--){const x=texts[i];if(typeof x.t==='number'){
      if(dano>=90){x.color='#ff8a5c';x.pop=1.6;x.life=1.15}else if(dano>=50){x.color='#ffd978';x.pop=1.32;x.life=1.0}else if(dano>=25)x.pop=1.12;break}}
    if(dano>=90)combatImpact(2.2);
    if(typeof vfxQuality==='undefined'||vfxQuality!=='low'||dano>=50){
      const bloq=t.blockFlash>.15,ang=Number.isFinite(an)?an:Math.atan2(t.y-(o?o.y:t.y),t.x-(o?o.x:t.x)),pw=bloq?.6:dano>=90?2:dano>=45?1.3:1;
      fx.push({kind:'impact',x:t.x-Math.cos(ang)*7,y:t.y-12-Math.sin(ang)*3,sy:t.y+3,a:ang,power:pw,color:bloq?'#bfe9ff':dano>=90?'#ff9a5c':dano>=45?'#ffd978':'#fff6d8',life:pw>1.5?.3:.22,max:pw>1.5?.3:.22});
    }
    if(o&&dano>=20){
      const costas=Math.abs(wrap(Math.atan2(o.y-t.y,o.x-t.x)-t.a))>2.2;
      if(o===p){S.maxHit=Math.max(S.maxHit,dano);if(costas)S.backDealt++}
      if(t===p){
        if(costas)S.backTaken++;
        if(clock-S.causeAt>1.4){
          const causa=costas?'PELAS COSTAS':t.guardBreak>0?'GUARDA QUEBRADA':t.st<25?'SEM STAMINA':(t.dodgeCD>1.2&&t.dodgeTime<=0)?'ESQUIVA EM RECARGA':'';
          if(causa){S.causeAt=clock;float(t.x,t.y-64,causa,'#ff9a8a')}
        }
      }
    }
    if(battleActivity==='training'&&o===p&&t===b)treino(dano);
  });
  return r;
};

/* contorno de guarda e de carga na cor do campeão (desenhado atrás do boneco) */
const COR_HEROI=['#ffd24a','#b58cff','#ff5468','#ffa23a','#9a6bff','#4de0c4','#5cff8a','#4db8ff','#9ad0ff','#d8b07a'];
if(typeof integratedDrawActor==='function'){const prevAtor=integratedDrawActor;integratedDrawActor=function(a){
  try{
    if(a&&a.hp>0&&!a.boss&&!a.trainingDummy&&(a.guard||a.cast>.08)){
      const guarda=!!a.guard,t=clock,cor=COR_HEROI[a.skin]||a.color||'#fff',pulso=.5+.5*Math.sin(t*(guarda?5:14));
      ctx.save();ctx.translate(a.x,a.y);ctx.strokeStyle=cor;ctx.shadowColor=cor;ctx.shadowBlur=guarda?12:16;ctx.lineWidth=guarda?3:2.4;
      const k=guarda?1:1+.1*pulso,fa=guarda?(a.blockFlash>0?.95:.55+.15*pulso):.5+.4*pulso;
      ctx.globalAlpha=fa*.35;const gr=ctx.createRadialGradient(0,-6,6,0,-6,44*k);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.6,cor);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,-6,34*k,46*k,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=fa;ctx.beginPath();ctx.ellipse(0,-6,25*k,37*k,0,0,Math.PI*2);ctx.stroke();
      if(!guarda){ctx.globalAlpha=fa*.5;ctx.beginPath();ctx.ellipse(0,-6,33*k,45*k,0,0,Math.PI*2);ctx.stroke()}
      ctx.restore();
    }
  }catch{try{ctx.restore()}catch{}}
  return prevAtor.apply(this,arguments);
};}

/* esquiva (de qualquer campeão): guarda o instante e quais recargas ela gerou, para premiar a esquiva perfeita */
if(typeof dodge==='function'){const prevDodge=dodge;dodge=function(a){
  const cd0=a&&a.cd?a.cd.slice():null,r=prevDodge.apply(this,arguments);
  if(r&&a){a._dashAt=clock;a._dp73=false;a._dashCd=cd0?a.cd.map((c,i)=>c>cd0[i]+.01?i:-1).filter(i=>i>=0):[]}
  return r};}

/* aviso padrão do rival: anel vermelho + "!" + marcador na direção do golpe */
function avisos(dt){
  for(const a of actors){
    if(!a||a.hp<=0||a===p||a.team===p.team){a&&(a._w73=0,a._wf73=false);continue}
    if(a.cast>.1){
      a._w73=(a._w73||0)-dt;
      if(a._w73<=0){a._w73=.22;ring(a.x,a.y,34,'#ff5a4d',.3);ring(a.x+Math.cos(a.a)*62,a.y+Math.sin(a.a)*62,15,'#ff5a4d',.3)}
      if(!a._wf73){a._wf73=true;float(a.x,a.y-60,'!','#ff6a58');S.aviso++}
    }else{a._w73=0;a._wf73=false}
  }
}

/* treino: último golpe, maior golpe, dano por segundo e recarga/recuperação da última habilidade */
const T={ultimo:0,maior:0,hab:'',cd:0,rec:0};
function treino(dano){T.ultimo=dano;T.maior=Math.max(T.maior,dano);pintaTreino()}
function pintaTreino(){
  let el=$q('#practiceExtra');
  if(!el){const b=$q('#battle');if(!b)return;el=document.createElement('div');el.id='practiceExtra';b.appendChild(el)}
  const ts=typeof trainingSession!=='undefined'&&trainingSession,dps=ts&&ts.elapsed>1?Math.round(ts.damage/ts.elapsed):0;
  const h=`<span>Último golpe <b>${T.ultimo}</b></span><span>Maior <b>${T.maior}</b></span><span>Dano/s <b>${dps}</b></span>${T.hab?`<span>${T.hab} · recarga <b>${T.cd.toFixed(1)}s</b> · recuperação <b>${T.rec.toFixed(2)}s</b></span>`:''}`;
  if(el.innerHTML!==h)el.innerHTML=h;el.hidden=battleActivity!=='training';
}
if(typeof cast==='function'){const prevCast=cast;cast=function(a,id,m){
  const r=prevCast.apply(this,arguments);
  safe(()=>{if(r&&a===p&&battleActivity==='training'){const i=a.kit.indexOf(id);T.hab=skills[id]?.name||'';T.cd=a.cd[i]||0;T.rec=Math.max(a.actionRecovery||0,a.cast||0,a.root||0);pintaTreino()}});
  return r};}

/* ================= TELAS ================= */
function intro(){
  const old=$q('#intro73');if(old)old.remove();
  if(battleActivity==='training')return;
  if(actors.length!==2||(window.V3Crown&&V3Crown.state&&V3Crown.state.on))return;   // 2×2 e Coroa têm título e placar próprios
  const b=$q('#battle');if(!b)return;
  const lado=(a,cls,tag)=>`<div class="i73-side ${cls}"><small>${tag}</small><b>${(a.label||'').toString().replace(/[<>&]/g,'')||'?'}</b>${champOf(a)&&champOf(a)!==(a.label||'')?`<em>${champOf(a)}</em>`:''}</div>`;
  const d=document.createElement('div');d.id='intro73';
  d.innerHTML=lado(p,'l','VOCÊ')+'<div class="i73-vs">VS</div>'+lado(b0(),'r','RIVAL');
  d.addEventListener('pointerdown',()=>d.remove());
  b.appendChild(d);setTimeout(()=>d.remove(),1500);
}
const b0=()=>actors.find(a=>a.team!==p.team)||b;

function novaLuta(){
  S.backDealt=S.backTaken=S.perfect=S.maxHit=S.aviso=0;S.causeAt=-9;
  T.ultimo=T.maior=0;T.hab='';
  S.xp0=safe(()=>window.ContaV42&&{lv:ContaV42.rec().lv,xp:ContaV42.rec().xp,total:ContaV42.rec().total});
  const x=$q('#practiceExtra');if(x)x.hidden=true;
  safe(intro);
}
const prevStep=step;
step=function(dt){
  const r=prevStep.apply(this,arguments);
  safe(()=>{
    if(clock<S.lastClock-.01)S.pend=true;
    if(S.pend&&state==='count'){S.pend=false;novaLuta()}
    S.lastClock=clock;
    if(state==='fight'){avisos(dt);if(battleActivity==='training')pintaTreino()}
  });
  return r;
};

/* ---- resumo de uma linha + barra de XP no resultado ---- */
function resumo(){
  const dlg=$q('#outcome .dialog');if(!dlg||$q('#res73'))return;
  if(battleActivity==='training'||!p||!b)return;
  let linha='';
  const dano=Math.round(p.damage||0),acertos=p.hits||0;
  if(S.backDealt>=2)linha=`Você acertou ${S.backDealt} golpes pelas costas`;
  else if(S.perfect>=2)linha=`${S.perfect} esquivas perfeitas deram o ritmo`;
  else if(S.backTaken>=2)linha=`Cuidado: ${S.backTaken} golpes vieram pelas costas`;
  else if((p.blockedDamage||0)>=60)linha=`Sua guarda segurou ${Math.round(p.blockedDamage)} de dano`;
  const base=`${dano} de dano em ${acertos} acerto${acertos===1?'':'s'}${S.maxHit?` · maior golpe ${S.maxHit}`:''}`;
  const el=document.createElement('div');el.id='res73';
  el.innerHTML=`<p class="r73-linha">${linha?`<b>${linha}.</b> `:''}${base}</p>`;
  let barra=null;
  const c=safe(()=>ContaV42.rec());
  if(c&&S.xp0&&c.total>S.xp0.total){
    const need=ContaV42.need,ganho=c.total-S.xp0.total,subiu=c.lv>S.xp0.lv;
    el.insertAdjacentHTML('beforeend',`<div class="r73-xp"><span class="r73-lv">Nível ${S.xp0.lv}</span><div class="r73-trilho"><i style="width:${Math.min(100,S.xp0.xp/need(S.xp0.lv)*100)}%"></i></div><small>+${ganho} XP</small></div>`);
    barra=el.querySelector('.r73-trilho i');const lv=el.querySelector('.r73-lv');
    const alvo=c.lv>=ContaV42.MAX_LV?100:c.xp/need(c.lv)*100;
    setTimeout(()=>{if(!barra.isConnected)return;if(subiu){barra.style.width='100%';setTimeout(()=>{if(!barra.isConnected)return;barra.style.transition='none';barra.style.width='0%';lv.textContent='Nível '+c.lv+' !';lv.classList.add('up');requestAnimationFrame(()=>requestAnimationFrame(()=>{barra.style.transition='';barra.style.width=alvo+'%'}))},650)}else barra.style.width=alvo+'%'},350);
  }
  const ref=$q('#rematch');dlg.insertBefore(el,ref||null);
}
function vigiaResultado(){
  const o=$q('#outcome');if(!o)return setTimeout(vigiaResultado,500);
  let ja=false;
  new MutationObserver(()=>{const vis=!o.hidden&&getComputedStyle(o).display!=='none';
    if(vis&&!ja){ja=true;setTimeout(()=>safe(resumo),260)}else if(!vis){ja=false;const r=$q('#res73');if(r)r.remove()}}).observe(o,{attributes:true,attributeFilter:['style','hidden','class']});
}
vigiaResultado();

/* ---- aviso quando a arena falha repetidamente ---- */
window.avisoErroLaco=function(){
  const t=Date.now();S.erros.push(t);S.erros=S.erros.filter(x=>t-x<2000);
  if(S.erros.length<6||t-S.falhaAt<30000)return;
  S.falhaAt=t;safe(()=>{
    const b=$q('#battle');if(!b||$q('#falha73'))return;
    const online=!!(window.OnlineV46&&OnlineV46.match&&OnlineV46.match.on)||(window.OnlineV45&&OnlineV45.state&&OnlineV45.state.mode==='server'&&OnlineV45.state.fase==='jogo');
    const arena=typeof modeRun!=='undefined'&&modeRun&&modeRun.id;
    const d=document.createElement('div');d.id='falha73';d.setAttribute('role','alert');
    d.innerHTML=`<span>A arena falhou. ${online||arena?'Você pode sair da luta.':'Reiniciar a luta resolve.'}</span>${online||arena?'':'<button data-f="re">Reiniciar luta</button>'}<button data-f="sair">Sair</button><button data-f="x" aria-label="Fechar">✕</button>`;
    d.addEventListener('click',e=>{const f=e.target.dataset&&e.target.dataset.f;if(!f)return;d.remove();
      if(f==='re')safe(()=>{battleActivity==='training'?resetPractice():start()});
      if(f==='sair')safe(()=>{(window.OnlineV46&&OnlineV46.match.on&&OnlineV46.stopMatch)?OnlineV46.stopMatch():leave()})});
    b.appendChild(d);setTimeout(()=>d.remove(),15000);
  });
};

/* ---- espera na fila online ---- */
setInterval(()=>safe(()=>{
  const st=window.OnlineV45&&OnlineV45.state;if(!st||!st.procurando||st.fase!=='fila'||!st.qt)return;
  const sub=$q('.v45-qsub');if(!sub)return;
  const seg=Math.floor((Date.now()-st.qt)/1000),on=st.online?`${st.online} jogador${st.online>1?'es':''} online`:'';
  const dica=seg<8?'Procurando alguém do seu nível…':seg<30?`Ainda procurando… se ninguém entrar, um bot difícil assume em cerca de ${Math.max(1,30-seg)} s`:'Sem rivais agora: um bot difícil entra no lugar';
  const t=(on?on+' · ':'')+dica;if(sub.textContent!==t)sub.textContent=t;
}),600);

/* ---- controles ajustáveis (tamanho, mover, inverter lados) ---- */
const ALVOS={stick:'#stick',attack:'#attack',skills:'#equipped'};
let cfg={s:1,pos:{}};
try{const x=JSON.parse(localStorage.getItem(LS)||'null');if(x&&typeof x==='object'){cfg.s=Math.min(1.4,Math.max(.8,+x.s||1));cfg.pos=x.pos&&typeof x.pos==='object'?x.pos:{}}}catch{}
const salva=()=>{try{localStorage.setItem(LS,JSON.stringify(cfg))}catch{}};
function aplica(){
  for(const [k,sel] of Object.entries(ALVOS)){const el=$q(sel);if(!el)continue;const q=cfg.pos[k]||[0,0];
    el.style.translate=(q[0]||q[1])?`${q[0]}px ${q[1]}px`:'';el.style.scale=cfg.s!==1?String(cfg.s):'';
    el.style.transformOrigin=k==='stick'?'left bottom':k==='attack'?'right bottom':'center bottom'}
}
function barra(){
  let b=$q('#c73bar');if(b)return b;
  b=document.createElement('div');b.id='c73bar';
  b.innerHTML='<span>Arraste os controles</span><button data-c="menos">Menor</button><button data-c="mais">Maior</button><button data-c="inv">Inverter lados</button><button data-c="rest">Restaurar</button><button data-c="ok" class="ok">Concluir</button>';
  b.addEventListener('click',e=>{const c=e.target.dataset&&e.target.dataset.c;if(!c)return;
    if(c==='menos')cfg.s=Math.max(.8,+(cfg.s-.1).toFixed(2));
    if(c==='mais')cfg.s=Math.min(1.4,+(cfg.s+.1).toFixed(2));
    if(c==='rest'){cfg={s:1,pos:{}}}
    if(c==='inv'){const w=$q('#battle').getBoundingClientRect();
      for(const [k,sel] of Object.entries(ALVOS)){const el=$q(sel);if(!el)continue;const r=el.getBoundingClientRect(),cx=r.left-w.left+r.width/2,q=cfg.pos[k]||[0,0];cfg.pos[k]=[q[0]+(w.width-2*cx),q[1]]}}
    if(c==='ok'){sai();return}
    aplica();salva()});
  $q('#battle').appendChild(b);return b;
}
let pausaDisp='';
function entra(){
  const pz=$q('#pause');pausaDisp=pz.style.display;pz.style.display='none';
  document.body.classList.add('c73-edit');barra().hidden=false;aplica();
}
function sai(){
  document.body.classList.remove('c73-edit');const b=$q('#c73bar');if(b)b.hidden=true;
  const pz=$q('#pause');pz.style.display=pausaDisp||'';salva();
}
function arrasto(){
  let ativo=null;
  const alvoDe=t=>{for(const [k,sel] of Object.entries(ALVOS)){const el=$q(sel);if(el&&el.contains(t))return k}return null};
  document.addEventListener('pointerdown',e=>{
    if(!document.body.classList.contains('c73-edit'))return;
    const k=alvoDe(e.target);if(!k)return;
    e.preventDefault();e.stopImmediatePropagation();
    const q=cfg.pos[k]||[0,0];ativo={k,x:e.clientX,y:e.clientY,q0:[q[0],q[1]],id:e.pointerId};
  },true);
  for(const tipo of ['touchstart','mousedown','click'])document.addEventListener(tipo,e=>{if(document.body.classList.contains('c73-edit')&&alvoDe(e.target)){e.preventDefault();e.stopImmediatePropagation()}},true);
  document.addEventListener('pointermove',e=>{if(!ativo||e.pointerId!==ativo.id)return;
    const w=$q('#battle').getBoundingClientRect(),z=+(getComputedStyle($q(ALVOS[ativo.k])).zoom)||1;
    cfg.pos[ativo.k]=[Math.round((ativo.q0[0]+(e.clientX-ativo.x)/z)),Math.round((ativo.q0[1]+(e.clientY-ativo.y)/z))];aplica()},true);
  const fim=e=>{if(ativo&&e.pointerId===ativo.id){ativo=null;salva()}};
  document.addEventListener('pointerup',fim,true);document.addEventListener('pointercancel',fim,true);
}
function montaPausa(){
  const dlg=$q('#pause .dialog'),res=$q('#resume');
  if(!dlg||!res)return setTimeout(montaPausa,500);
  if($q('#c73Btn'))return;
  const b=document.createElement('button');b.id='c73Btn';b.type='button';b.className='ghost';b.textContent='Ajustar controles';
  b.addEventListener('click',entra);dlg.insertBefore(b,res);
  arrasto();aplica();
}
montaPausa();
// os botões são reconstruídos a cada luta: reaplica quando uma nova luta começa
document.addEventListener('visibilitychange',()=>safe(aplica));
setInterval(()=>safe(aplica),2500);
})();
