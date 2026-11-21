const { JSDOM, VirtualConsole } = require('jsdom');const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.join(__dirname,'..');
const noopProxy=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:k==='width'||k==='height'?0:noopProxy(),apply:()=>noopProxy(),set:()=>true});
function stubs(window){
 const ctx=noopProxy();
 window.HTMLCanvasElement.prototype.getContext=function(){return ctx};window.HTMLCanvasElement.prototype.toDataURL=()=>'data:,';
 window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};
 window.matchMedia=window.matchMedia||(()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){}}));
 window.ResizeObserver=class{observe(){}disconnect(){}unobserve(){}};window.IntersectionObserver=class{observe(){}disconnect(){}unobserve(){}};
 window.AudioContext=window.webkitAudioContext=class{constructor(){return noopProxy()}};
 window.scrollTo=()=>{};window.alert=()=>{};window.HTMLElement.prototype.setPointerCapture=()=>{};window.HTMLElement.prototype.scrollIntoView=()=>{};
 if(!window.navigator.vibrate)window.navigator.vibrate=()=>true;window.OffscreenCanvas=undefined;
 window.Image=class{set src(v){this._s=v}get src(){return this._s}addEventListener(){}};
}
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const srcs=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]).filter(s=>!/\/lib\//.test(s));
const code=new Map();for(const s of srcs)code.set(s,new vm.Script(fs.readFileSync(path.join(ROOT,s),'utf8'),{filename:s}));   // compila uma vez, serve para todas as partidas
const page=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,'');
async function load(query='?allheroes=1'){
 const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e.message||e).slice(0,140)));vc.on('error',e=>errs.push(String(e).slice(0,140)));
 const dom=new JSDOM(page,{url:'http://localhost:8000/index.html'+query,runScripts:'outside-only',pretendToBeVisual:false,virtualConsole:vc,beforeParse:stubs});
 if(dom.window.document.readyState!=='complete')await new Promise(r=>dom.window.addEventListener('load',()=>r()));
 const ctx=dom.getInternalVMContext();
 for(const s of srcs){try{code.get(s).runInContext(ctx)}catch(e){errs.push(s+': '+String(e.message).slice(0,120))}}
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));dom.window.dispatchEvent(new dom.window.Event('load'));
 await new Promise(r=>setTimeout(r,300));
 return{dom,errs,ev:c=>dom.window.eval(c)};
}
async function startDuel(g){
 g.ev(`document.querySelector('#welcomeEnter')?.click();document.querySelector('#profileName').value='Srv';document.querySelector('#profileForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}))`);
 await new Promise(r=>setTimeout(r,200));
 g.ev(`try{RetQA.set({tutorial:true})}catch{};draw=function(){};lobbyPrefs.mode='1v1';queueMatch('1v1');`);
}
module.exports={load,startDuel,ROOT};
if(require.main===module)(async()=>{
 const t0=Date.now();const g=await load();console.log('carregou em',Date.now()-t0,'ms; erros:',g.errs.length);console.log(g.errs.slice(0,6).join('\n'));
 await startDuel(g);console.log('state após começar:',g.ev('state'),'| p/b:',g.ev('!!p&&!!b'),'| profile:',g.ev('account.profile?.name'));
 let n=0,ms=0;const t1=process.hrtime.bigint();
 for(let i=0;i<1800;i++){g.ev('ai(1/30,p);step(1/30);if(state===\"end\"||state===\"select\"){queueMatch(\"1v1\")}');n++}
 const el=Number(process.hrtime.bigint()-t1)/1e6;console.log('1800 ticks (60 s de luta) em',el.toFixed(0),'ms =',(el/n).toFixed(3),'ms/tick | state:',g.ev('state'),'hp:',g.ev('[Math.round(p.hp),Math.round(b.hp)]'),'erros:',g.errs.length);
 console.log(g.errs.slice(0,5).join('\n'));process.exit(0)})();
