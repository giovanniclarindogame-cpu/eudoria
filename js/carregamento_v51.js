'use strict';
/*
 * Tela de carregamento (v51) — antes de toda luta, carrega e "aquece" tudo que ela precisa, sob uma tela própria.
 *  - Os campeões da luta (os que aparecem em `actors`) têm suas artes baixadas e decodificadas (lista em js/precarga_dados.js, gerada por
 *    scripts/gerar_precarga.cjs) e são desenhados uma vez fora da tela, para o jogo montar os recortes de sprites (getImageData) e enviar as
 *    imagens à placa de vídeo AGORA e não no meio da luta (era isso que travava o duelo em celular fraco).
 *  - Durante a espera a luta fica parada (state='loading'); depois segue com a contagem normal (3-2-1).
 *  - Se tudo já estiver pronto (mesmos campeões da luta anterior), nem aparece: a luta começa na hora.
 *  - Online: o jogo avisa "pronto" e espera o outro lado (Carregamento.opcoes={esperar:true}, Carregamento.liberar()).
 *  - ?semcarga=1 desliga (para comparar). Tempo máximo de espera: 25 s; depois a luta começa assim mesmo.
 */
(function(){
const $q=s=>document.querySelector(s);
const OFF=/[?&]semcarga=1/.test(location.search);
const MAX_MS=25000,MIN_MS=700;
// Decoded/uploaded images survive between matches; prepare only new sheets.
const decodificadas=new WeakSet(),enviadas=new WeakSet();
const C=window.Carregamento={aquecer:{},on:false,esperando:false,morno:new Set(),opcoes:null,aoPreparar:null,liberado:false,ultima:null};
const DICAS=[
 'Arraste uma habilidade para escolher a direção do golpe.',
 'O botão grande é o dash: ele tem um instante de invulnerabilidade.',
 'A ultimate só libera quando sua vida está em 20% ou menos.',
 'O duelo é melhor de 3 rounds: quem vencer 2 leva a luta.',
 'Cada campeão tem um jeito próprio de lutar: teste todos no Dojo.',
 'Vencer a primeira luta do dia dá o dobro de XP de conta.'
];
// ---------- Caçada: tela própria do chefe (arte do Zorvath) ----------
const DICAS_CACADA=[
 'Fique longe do círculo rosa: o Chicote de Cauda atinge tudo ao redor dele.',
 'Pilares de cristal bloqueiam o Raio Perfurante. Use-os como cobertura.',
 'Na Pressão Psíquica, saia do círculo antes que ele feche.',
 'Supernova: cause muito dano para interromper ou saia da área.',
 'Depois de uma Supernova interrompida, o Zorvath fica exausto: ataque com tudo!',
 'Em dupla, um chama a atenção enquanto o outro ataca.'
];
const ehCacada=custom=>{try{return !!(custom&&custom.cacada)||!!(typeof modeRun!=='undefined'&&modeRun&&modeRun.hunt)||!!(window.OnlineV46&&OnlineV46.match&&OnlineV46.match.caca)}catch{return false}};
const ARTE_BOSS='assets/chefes_v78/zorvath/',EXTRAS=new Map();
function extrasCacada(){   // folhas do chefe, efeitos, arena e ícones: baixadas aqui, sob a tela de carregamento
 const urls=[];for(const f of [1,2,3])for(const l of 'ABC')urls.push(ARTE_BOSS+'forma'+f+'_'+l+'.webp');
 urls.push(ARTE_BOSS+'arena.webp',ARTE_BOSS+'pilar.webp');
 for(const n of ['supernova','raio','disco','poder'])urls.push(ARTE_BOSS+'efeitos/'+n+'.webp?v='+({supernova:1,raio:1,disco:1,poder:1})[n]);
 for(let i=0;i<6;i++)urls.push(ARTE_BOSS+'icones/s'+i+'.webp?v=1');
 for(let i=0;i<3;i++)urls.push(ARTE_BOSS+'icones/b'+i+'.webp?v=1');
 return urls.map(u=>{let im=EXTRAS.get(u);if(!im){im=new Image();im.src=u;EXTRAS.set(u,im)}return im});
}
const nomeHeroi=id=>{try{return CHAMPIONS[id].name}catch{return 'Campeão'}};
const arte=id=>{try{return championArt(CHAMPIONS[id])}catch{return ''}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const quadro=()=>new Promise(r=>{let ok=false;const f=()=>{if(!ok){ok=true;r()}};requestAnimationFrame(f);setTimeout(f,60)});   // rAF não roda em aba escondida
const heroisDaLuta=()=>{const s=new Set();for(const a of (typeof actors!=='undefined'&&actors)||[]){if(Number.isInteger(a.skin)&&CHAMPIONS[a.skin]&&Array.isArray(a.kit)&&a.kit.length===6)s.add(a.skin)}return[...s]};
function imagensDe(ids){
 const urls=new Set();for(const id of ids)for(const u of (window.PRECARGA&&PRECARGA[id])||[])urls.add(u);
 return [...urls].map(u=>window.LazyArt&&LazyArt.porUrl.get(u)).filter(Boolean);
}
const pronta=im=>{try{return im.__lz&&!im.__lz.on?false:(im.complete&&im.naturalWidth>0)}catch{return false}};
function rotuloModo(){
 try{if(arenaModeId&&ARENA_MODES[arenaModeId])return String(ARENA_MODES[arenaModeId].name).toUpperCase()}catch{}
 try{if(battleActivity==='training')return 'DOJO'}catch{}
 try{return matchMode==='2v2'?'EQUIPES 2×2':'DUELO 1×1'}catch{}return 'LUTA';
}

/* ---------- tela ---------- */
function tela(){
 let el=$q('#carregandoV51');if(el)return el;
 el=document.createElement('section');el.id='carregandoV51';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 document.body.appendChild(el);return el;
}
function lado(id,rotulo,dir){
 const img=id!=null?`<img src="${esc(arte(id))}" alt="" draggable="false">`:'<span class="c51-q">?</span>';
 return `<figure class="c51-side ${dir}">${img}<figcaption>${esc(rotulo)}</figcaption></figure>`;
}
function mostrar(ids,custom){
 const el=tela();
 let esq=null,dir=null;try{esq=Number.isInteger(p?.skin)?p.skin:null;dir=(b&&Number.isInteger(b.skin)&&Array.isArray(b.kit)&&b.kit.length===6)?b.skin:null}catch{}
 if(custom){esq=Number.isInteger(ids[0])?ids[0]:null;dir=null}
 if(ehCacada(custom)){
  el.classList.add('c51-cacada');
  el.innerHTML=`<div class="c51-art"></div><div class="c51-wrap c51-cac"><header><small>CAÇADA DO DIA</small><b>ZORVATH</b><em>Imperador Cristalino</em></header><div class="c51-low"><div class="c51-bar"><i></i></div><p class="c51-msg">Carregando…</p><p class="c51-dica">${esc(DICAS_CACADA[Math.floor(Math.random()*DICAS_CACADA.length)])}</p></div></div>`;
  el.hidden=false;el.classList.remove('sai');document.body.classList.add('c51-on');C.on=true;return;
 }
 el.classList.remove('c51-cacada');
 const rivalNome=(()=>{try{return b?.label||'Rival'}catch{return 'Rival'}})();
 el.innerHTML=`<div class="c51-bg"></div><div class="c51-wrap">
  <header><small>${esc(custom?custom.topo:rotuloModo())}</small><b>${esc(custom?custom.titulo:'PREPARANDO A ARENA')}</b></header>
  <div class="c51-vs">${lado(esq,esq!=null?nomeHeroi(esq):'Você','left')}<div class="c51-vsx"><b>VS</b></div>${lado(dir,dir!=null?nomeHeroi(dir):(custom?'Rival':rivalNome),'right')}</div>
  <div class="c51-bar"><i></i></div><p class="c51-msg">Carregando…</p><p class="c51-dica">${esc(DICAS[Math.floor(Math.random()*DICAS.length)])}</p></div>`;
 el.hidden=false;el.classList.remove('sai');document.body.classList.add('c51-on');
 C.on=true;
}
function progresso(f,msg){
 const el=$q('#carregandoV51');if(!el)return;
 if(f!=null){const i=el.querySelector('.c51-bar i');if(i)i.style.width=Math.max(4,Math.min(100,Math.round(f*100)))+'%'}
 if(msg){const m=el.querySelector('.c51-msg');if(m)m.textContent=msg}
}
function esconder(){
 const el=$q('#carregandoV51');C.on=false;document.body.classList.remove('c51-on');if(!el||el.hidden)return;
 el.classList.add('sai');setTimeout(()=>{if(!C.on)el.hidden=true},260);
}

/* ---------- segurar e retomar a luta ---------- */
function segurar(){
 C.estado={count:typeof count==='number'?count:3.4};
 state='loading';const c=$q('#countdown');if(c)c.style.display='none';
}
function retomar(){
 if(state!=='loading')return false;
 state='count';count=3.4;last=performance.now();
 const c=$q('#countdown');if(c){c.style.display='flex';c.dataset.go='false'}
 return true;
}

/* ---------- preparo ---------- */
async function preparar(ids,imgs,mostrarTela,livre){
 const t0=performance.now(),total=imgs.length+ids.length;let feito=0;
 const passo=msg=>{feito++;if(mostrarTela)progresso(feito/total,msg)};
 // 1) baixar
 imgs.forEach(im=>{try{lazyStart(im)}catch{}});
 const cancelar=[];
 const baixar=Promise.all(imgs.map(im=>new Promise(res=>{
  let concluida=false;
  const fim=()=>{if(concluida)return;concluida=true;im.removeEventListener('load',fim);im.removeEventListener('error',fim);passo(`Carregando as artes… ${Math.min(feito+1,imgs.length)}/${imgs.length}`);res()};
  if(pronta(im)||im.complete)return fim(); // a completed network error must not wait another 25 s
  im.addEventListener('load',fim);im.addEventListener('error',fim);cancelar.push(fim);
 })));
 let limite;
 try{await Promise.race([baixar,new Promise(r=>{limite=setTimeout(r,MAX_MS)})])}
 finally{clearTimeout(limite);for(const fim of cancelar)fim()}
 if(!livre&&state!=='loading'&&mostrarTela)return false;
 // 2) decodificar (em lotes, para a tela continuar viva)
 if(mostrarTela)progresso(null,'Preparando as imagens…');
 const novas=imgs.filter(im=>pronta(im)&&!decodificadas.has(im));
 for(let i=0;i<novas.length;i+=4){
  await Promise.all(novas.slice(i,i+4).map(async im=>{try{if(im.decode)await im.decode();decodificadas.add(im)}catch{}}));
  await quadro();
  if(performance.now()-t0>MAX_MS+8000)break;
 }
 // 2b) passa cada folha inteira por um desenho reduzido: obriga o navegador a decodificá-la e mandá-la à placa de vídeo agora
 {const mini=document.createElement('canvas');mini.width=mini.height=48;const gm=mini.getContext('2d');
  const enviar=imgs.filter(im=>pronta(im)&&!enviadas.has(im));
  for(let i=0;i<enviar.length;i++){const im=enviar[i];try{gm.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,0,0,48,48);enviadas.add(im)}catch{}if(i%3===2)await quadro()}
  mini.width=mini.height=0;}
 // 2c) aquecedores próprios de cada campeão (a 1ª leitura de pixels de cada folha de efeito é a parte cara; as seguintes são baratas)
 for(const id of ids){const w=C.aquecer[id];if(w&&!C.morno.has(id)){try{await w()}catch(e){console.warn('[Eldoria] aquecedor',id,e)}await quadro()}}
 // 3) aquecer: desenha cada campeão uma vez fora da tela (monta os recortes de sprites e envia as imagens à placa de vídeo)
 const cv=document.createElement('canvas');cv.width=cv.height=200;const g=cv.getContext('2d');
 for(const id of ids){
  if(mostrarTela)progresso(null,`Aquecendo ${nomeHeroi(id)}…`);
  if(!C.morno.has(id)){
   let guarda;try{guarda=lobbyActor.skin}catch{}
   for(let k=0;k<3;k++){
    try{lobbyActor.skin=id;g.clearRect(0,0,200,200);g.save();g.translate(100,172);g.imageSmoothingEnabled=false;drawAnimatedFighter(g,lobbyActor,150,k*.37)}catch{}
    try{g.restore()}catch{}
    await quadro();
   }
   try{lobbyActor.skin=guarda}catch{}
   C.morno.add(id);
  }
  passo();
 }
 return true;
}
async function iniciarPreparo(mostrarTela,esperar){
 if(state!=='loading'){mostrarTela=false;esperar=false}   // alguém já mudou o estado (luta que começa direto, tutorial): só prepara por baixo, sem tela por cima
 const ids=heroisDaLuta(),imgs=imagensDe(ids).concat(ehCacada()?extrasCacada():[]);
 const tudoPronto=imgs.every(pronta)&&ids.every(id=>C.morno.has(id));
 C.ultima={ids,imagens:imgs.length,rapido:tudoPronto};
 if(tudoPronto){C.aoPreparar&&C.aoPreparar();if(!esperar){retomar();return}}
 else{
  if(mostrarTela)mostrar(ids);
  const t0=performance.now();
  try{await preparar(ids,imgs,mostrarTela)}catch(e){console.warn('[Eldoria] preparo da luta',e)}
  if(mostrarTela){const falta=MIN_MS-(performance.now()-t0);if(falta>0)await new Promise(r=>setTimeout(r,falta))}
  if(state!=='loading'){esconder();return}
  C.aoPreparar&&C.aoPreparar();
 }
 // online: espera o outro lado
 if(esperar&&!C.liberado){
  C.esperando=true;if(mostrarTela){if(!C.on)mostrar(ids);progresso(1,'Esperando o rival…')}
  await new Promise(res=>{C.resolver=res;setTimeout(res,MAX_MS)});
  C.esperando=false;
 }
 C.liberado=false;C.opcoes=null;
 retomar();esconder();
}
// chamado pelo online quando o outro lado está pronto (ou quando chega o primeiro estado do servidor)
C.liberar=function(){C.liberado=true;if(C.resolver){const r=C.resolver;C.resolver=null;r()}};
C.cancelar=function(){C.resolver&&C.liberar();C.liberado=false;C.esperando=false;esconder()};

/* ---------- baixar antes, no clique (v67) ---------- */
// precisa(ids): true se ainda falta baixar/aquecer alguma arte desses campeões
C.precisa=function(ids,custom){
 ids=(ids||[]).filter(id=>Number.isInteger(id)&&CHAMPIONS[id]);
 if(!ids.length||OFF)return false;
 return !(imagensDe(ids).concat(ehCacada(custom)?extrasCacada():[]).every(pronta)&&ids.every(id=>C.morno.has(id)));
};
// garantir(ids, {topo,titulo}): mostra a tela de carregamento e baixa/prepara as artes desses campeões. Resolve quando termina (ou em MAX_MS).
C.garantir=async function(ids,custom){
 ids=(ids||[]).filter(id=>Number.isInteger(id)&&CHAMPIONS[id]);
 if(!C.precisa(ids,custom)||C.on)return false;
 const imgs=imagensDe(ids).concat(ehCacada(custom)?extrasCacada():[]),t0=performance.now();
 mostrar(ids,Object.assign({topo:'ENTRANDO',titulo:'PREPARANDO O JOGO'},custom||{}));
 try{await preparar(ids,imgs,true,true)}catch(e){console.warn('[Eldoria] preparo antecipado',e)}
 const falta=MIN_MS-(performance.now()-t0);if(falta>0)await new Promise(r=>setTimeout(r,falta));
 esconder();return true;
};
// segundoPlano(ids): começa a baixar por trás (sem tela), por exemplo enquanto procura rivais
C.segundoPlano=function(ids){try{imagensDe((ids||[]).filter(id=>Number.isInteger(id)&&CHAMPIONS[id])).forEach(im=>{try{lazyStart(im)}catch{}})}catch{}};

/* ---------- aquecedores por campeão ---------- */
C.aquecer[4]=async function(){   // Eclipse: recorta e limpa o quadro 0 de cada folha de efeito
 if(typeof eclipse30Cell!=='function'||typeof ECLIPSE30_FX==='undefined')return;
 for(const k of Object.keys(ECLIPSE30_FX)){try{if(ECLIPSE30_FX[k].complete&&ECLIPSE30_FX[k].naturalWidth)eclipse30Cell(k,0)}catch{}await quadro()}
};

C.aquecer[2]=async function(){   // Ronin: prepara o quadro 0 de cada folha de efeito e já o desenha uma vez (envia à placa de vídeo)
 if(typeof astralSoftCell!=='function'||typeof ICHIGO27_FX==='undefined')return;
 const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d');
 for(const k of Object.keys(ICHIGO27_FX)){const im=ICHIGO27_FX[k];try{if(im.complete&&im.naturalWidth){g.drawImage(astralSoftCell(im,0),0,0,64,64)}}catch{}await quadro()}
};

/* ---------- gancho: toda luta passa por start() ---------- */
if(!OFF){
 const prevStart=start;
 start=function(){
  const r=prevStart.apply(this,arguments);
  try{
   if(C.on)return r;                       // já está carregando
   const op=C.opcoes||{};C.liberado=false;
   if(state==='count'){segurar();setTimeout(()=>iniciarPreparo(true,!!op.esperar),0)}   // adia: quem chamou ainda troca os campeões (swapHero) depois do start
   else if(state==='paused')setTimeout(()=>iniciarPreparo(false,false),0);               // tutorial na frente: só prepara por baixo
  }catch(e){console.error('[Eldoria] tela de carregamento',e)}
  return r;
 };
}
})();
