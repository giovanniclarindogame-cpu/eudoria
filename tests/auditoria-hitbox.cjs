// Auditoria: alcance real do golpe (onde causa dano) × extensão visual do efeito (pixels que mudam na frente do personagem).
// uso: node tests/auditoria-hitbox.cjs [heróis separados por vírgula] — imprime tabela e marca divergências.
const { chromium } = require('playwright');
const AUD_SLOTS_ENV=process.env.AUD_SLOTS||'';
const HEROES=(process.argv[2]||'0,1,2,3,4,5,6,7,8,9').split(',').map(Number);
(async()=>{
 const br=await chromium.launch();
 const p=await (await br.newContext({viewport:{width:1000,height:450},deviceScaleFactor:1})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8000/index.html?allheroes=1');await p.waitForTimeout(900);await p.getByText('ENTRAR',{exact:true}).click();await p.fill('input','Audit');await p.getByText('Continuar',{exact:true}).click();await p.waitForTimeout(1400);
 const rows=[];
 for(const h of HEROES){
  const r=await p.evaluate(async({h,AUD_SLOTS})=>{
   const out=[];
   matchMode='1v1';battleActivity='training';account.champions=[0,1,2,3,4,5,6,7,8,9];account.activeChampion=h;selected=[...CHAMPIONS[h].kit];selected.forEach(i=>{if(!account.owned.includes(i))account.owned.push(i)});account.build=[...selected];
   start();state='fight';count=0;document.getElementById('countdown').style.display='none';window.requestAnimationFrame=()=>0;
   const V=V3API.V2[h];let slots=[...V.s,5];if(AUD_SLOTS){const only=AUD_SLOTS.split(',').map(Number);slots=slots.filter(x=>only.includes(x))}const dashId=V3API.dashIdOf(p);if(dashId!=null&&!AUD_SLOTS)slots.push(-1);
   const reset=()=>{const s=reworkState(p);s.value=100;s.arm=0;s.finger=0;s.powerT=0;p.cd=p.cd.map(()=>0);p.cast=0;p.actionRecovery=0;p.skillLock=0;p.root=0;p.v3dashCD=0;p.hp=p.max=99999;p.inv=0;p.slow=0;p.rwCast=null;Reforged.dashes.length=0;Reforged.projectiles.length=0;Reforged.effects.length=0;objects.length=0;p.x=150;p.y=H/2;p.a=0;p.rwFacing=0;b.cd=b.cd.map(()=>999);b.root=9999;b.hp=b.max=99999;b.inv=0;b.guard=false};
   const fire=(slot)=>{if(slot===-1){V3API.doDash(p);return}const id=p.kit[slot],sk=skills[id];if(sk.holdMax){rwBeginCharge(p,0,slot);for(let i=0;i<Math.round(sk.holdMax*60);i++)step(1/60);rwReleaseCharge(p,0)}else cast(p,id,0)};
   for(const slot of slots){
    const name=slot===-1?'DASH:'+skills[dashId].name:skills[p.kit[slot]].name;
    // alcance do dano
    let reach=0,hits=[];
    for(let d=20;d<=520;d+=15){
     reset();b.x=p.x+d;b.y=p.y;const x0=p.x;const hp0=b.hp;fire(slot);
     for(let i=0;i<150;i++){step(1/60);b.x=x0+d;b.y=H/2;b.root=9999}
     if(b.hp<hp0){reach=d;hits.push(d)}
    }
    // largura lateral no meio do alcance
    let half=0;
    if(reach>0){const dm=Math.max(30,Math.round(hits[Math.floor(hits.length/2)]));
     for(let lat=10;lat<=140;lat+=10){reset();b.x=p.x+dm;b.y=p.y+lat;const x0=p.x;const hp0=b.hp;fire(slot);for(let i=0;i<150;i++){step(1/60);b.x=x0+dm;b.y=H/2+lat;b.root=9999}if(b.hp<hp0)half=lat}}
    // extensão visual: diferença entre quadro com a habilidade e quadro de base
    const cap=(withSkill)=>{let sd=77;Math.random=()=>{sd=(Math.imul(sd,1664525)+1013904223)>>>0;return sd/4294967296};reset();b.x=W-80;b.y=70;if(withSkill)fire(slot);const frames=[];for(let i=0;i<110;i++){step(1/60);b.x=W-80;b.y=70;if(i%3===0){draw();const c=document.getElementById('arena');const o=document.createElement('canvas');o.width=c.width;o.height=c.height;const g=o.getContext('2d');g.drawImage(c,0,0);frames.push(g.getImageData(0,0,c.width,c.height).data)}}return {frames,sc:scale,ox,oy,d:document.getElementById('arena').width/document.getElementById('arena').getBoundingClientRect().width,w:document.getElementById('arena').width,h:document.getElementById('arena').height}};
    const A=cap(false),B=cap(true);let fwd=0,lat=0;
    const px2w=(px)=>((px/B.d)-B.ox)/B.sc,py2w=(py)=>((py/B.d)-B.oy)/B.sc;
    for(let f=0;f<A.frames.length;f++){const a=A.frames[f],bb=B.frames[f];
     for(let y=0;y<B.h;y+=3)for(let x=0;x<B.w;x+=3){const i=(y*B.w+x)*4;const df=Math.abs(a[i]-bb[i])+Math.abs(a[i+1]-bb[i+1])+Math.abs(a[i+2]-bb[i+2]);
      if(df>90){const wx=px2w(x)-150,wy=py2w(y)-H/2;if(wx>48&&wx<700&&Math.abs(wy)<160){if(wx>fwd)fwd=wx;if(wx>45&&Math.abs(wy)>lat)lat=Math.abs(wy)}}}}
    out.push({slot,name,reach,half,vis:Math.round(fwd),visHalf:Math.round(lat)});
   }
   return out},{h,AUD_SLOTS:AUD_SLOTS_ENV});
  for(const x of r)rows.push({hero:h,...x});
  console.log('herói',h,'ok');
 }
 console.log(JSON.stringify(rows));
 console.log('errs',errs.slice(0,2));
 await br.close();
})();
