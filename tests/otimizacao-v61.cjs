// HUD keeps node identity when values repeat and updates immediately when they change.
const {chromium}=require('playwright');
const assert=require('assert/strict');
const cp=require('child_process');
(async()=>{
 const browser=await chromium.launch();
 async function run(baseline){
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(baseline){
   const files=cp.execFileSync('git',['diff','HEAD','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(p=>p.startsWith('js/')&&p.endsWith('.js'));
   for(const file of files){const body=cp.execFileSync('git',['show','HEAD:'+file]);await page.route('**/'+file+'*',route=>route.fulfill({body,contentType:'application/javascript'}));}
  }
  await page.goto('http://localhost:8000/index.html?allheroes=1&semcarga=1');
  await page.getByText('ENTRAR',{exact:true}).click();await page.fill('#profileName','Otimização');await page.getByText('Continuar',{exact:true}).click();await page.waitForSelector('.v40-home');
  await page.evaluate(()=>{try{RetQA.set({tutorial:true})}catch{};document.querySelector('#ljModal')?.remove();equipChampion(0,false);queueMatch('1v1');state='paused'});
  const snapshots=await page.evaluate(()=>{
   const out=[];
   for(let hero=0;hero<10;hero++){
    V3Modes.swapHero(p,hero,1000);V3Modes.swapHero(b,(hero+1)%10,1000);
    for(let phase=0;phase<3;phase++){
     state=phase===0?'fight':phase===1?'paused':'count';
     p.hp=phase===0?1000:150;p.mp=phase===0?120:25;p.st=phase===0?100:10;p.basic=p.skillLock=p.actionRecovery=p.cast=p.punchTime=p.guardBreak=0;p.guard=false;p.dodgeCD=phase===2?2.1:0;
     p.cd.fill(0);if(phase===2)p.cd[p.kit[0]]=3.25;
     b.hp=678;time=123;updateUI();
out.push({hero,phase,text:['php','bhp','resText','enemyResource','timer','attack','defend','dodge'].map(id=>document.getElementById(id).textContent),skills:[...document.querySelectorAll('#equipped .skill')].map(e=>({text:e.textContent,hidden:e.hidden,disabled:e.getAttribute('aria-disabled'),cool:e.querySelector('.cool').style.cssText})),bars:['phbar','bhbar','pmbar','bmbar'].map(id=>['width','background'].map(key=>document.getElementById(id).style[key]))});
    }
   }
   return out;
  });
  if(!baseline){
   const checks=await page.evaluate(()=>{
    const hp=document.getElementById('php');updateUI();const text=hp.firstChild;for(let i=0;i<100;i++)updateUI();const reused=hp.firstChild===text;
    p.hp=432;updateUI();const immediate=hp.textContent==='432 / '+p.max;
    battleActivity='training';trainingSession={damage:100,hits:2,targets:1,elapsed:5};updateUI();const meter=document.querySelector('#practiceMeter b');for(let i=0;i<100;i++)updateUI();const trainingReused=meter===document.querySelector('#practiceMeter b');trainingSession.damage=101;updateUI();return{reused,immediate,trainingReused,trainingUpdated:document.querySelector('#practiceMeter b').textContent==='101 dano'};
   });
   assert(Object.values(checks).every(Boolean),JSON.stringify(checks));
  }
  assert.deepEqual(errors,[]);await page.close();return snapshots;
 }
 const baseline=process.env.COMPARE_HEAD?await run(true):null;
 const current=await run(false);if(baseline)assert.deepEqual(current,baseline,'all 10 champions and 3 control states must preserve the HUD');
 console.log('PASS: HUD updates immediately, unchanged HP/training nodes reused, 10 champions × 3 states, no JS errors'+(baseline?', identical to HEAD':''));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
