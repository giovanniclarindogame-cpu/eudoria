'use strict';
// Portraits keep their detailed art; every combat pose shares the original pixel scale.
const pixelArenaSource=drawAnimatedFighter;
drawAnimatedFighter=function(g,a,size=72,t=vfxTime){
 return EldoriaPixels.paint(g,(ink,nativeSize)=>pixelArenaSource(ink,a,nativeSize,t),size);
};
if(window.arenaQA)arenaQA.drawAnimatedFighter=drawAnimatedFighter;
window.arenaPixelQA={height:EldoriaPixels.height,source:pixelArenaSource};
