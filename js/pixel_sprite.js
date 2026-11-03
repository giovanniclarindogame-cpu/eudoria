'use strict';
// Same sampling grid in the arena and in the animation preview.
const EldoriaPixels=(()=>{
 const height=56,surface=document.createElement('canvas');surface.width=surface.height=160;
 const ink=surface.getContext('2d');
 function paint(g,painter,size=72){
  ink.setTransform(1,0,0,1,0,0);ink.clearRect(0,0,160,160);
  ink.save();ink.translate(80,126);ink.imageSmoothingEnabled=false;
  let painted;try{painted=painter(ink,height);}finally{ink.restore();}
  if(painted===false)return false;
  const factor=size/height;
  g.save();g.imageSmoothingEnabled=false;
  g.drawImage(surface,-80*factor,-126*factor,160*factor,160*factor);
  g.restore();return true;
 }
 return {height,paint};
})();
