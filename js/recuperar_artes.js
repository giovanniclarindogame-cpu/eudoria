'use strict';
// Images may fail temporarily on mobile connections. Retry the original resource
// with a fresh request, preserving the Image object used by every renderer.
const animationAssetRecovery=(()=>{
 const tracked=new Map();
 function track(im){
  if(!im||tracked.has(im))return im;
  const idle=im=>!!(im.__lz&&!im.__lz.on);   // imagem de carga sob demanda que ainda não começou: não mexer (perguntar 'complete' a faria baixar)
  const entry={source:im.__lz?im.__lz.src:im.src,attempts:0,timer:null};tracked.set(im,entry);
  const retry=()=>{
   if(entry.timer||entry.attempts>=2||!entry.source)return;
   const delay=entry.attempts?1500:400;entry.attempts++;
   entry.timer=setTimeout(()=>{entry.timer=null;const url=new URL(entry.source,location.href);url.searchParams.set('animation_retry',entry.attempts);im.src=url.href;},delay);
  };
  im.addEventListener('error',retry);
  im.addEventListener('load',()=>{if(entry.timer){clearTimeout(entry.timer);entry.timer=null;}});
  if(!idle(im)&&im.complete&&!im.naturalWidth)retry();
  return im;
 }
 const registry=[DOJO_BASE_IMAGE,...Object.values(DOJO_STRIKE_IMAGES),...Object.values(dojoKitImages),...Object.values(dojoWoundImages),...Object.values(astralImages),...Object.values(eclipseImages),...Object.values(rpImages),...REWORK_ART.values(),...Object.values(SANCTUARY_ART)];
 registry.forEach(track);
 const parada=im=>!!(im.__lz&&!im.__lz.on);
 window.addEventListener('online',()=>{for(const [im,entry]of tracked)if(!parada(im)&&im.complete&&!im.naturalWidth&&!entry.timer){entry.attempts=0;im.src=entry.source;}});
 return {track,status:()=>({total:tracked.size,idle:[...tracked.keys()].filter(parada).length,ready:[...tracked.keys()].filter(im=>!parada(im)&&im.naturalWidth>0).length,failed:[...tracked.keys()].filter(im=>!parada(im)&&im.complete&&!im.naturalWidth).map(im=>im.src)})};
})();
const recoverableReworkImage=rwImage;
rwImage=file=>animationAssetRecovery.track(recoverableReworkImage(file));
