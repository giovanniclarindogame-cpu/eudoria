'use strict';
// Six body drawings per technique: anticipation, action and recovery.
function combat35Phase(age,release,duration,holding=false){
 if(holding)return age<.12?0:1;
 if(age<release)return age<release*.5?0:1;
 const recovery=Math.max(release+.01,duration-.15);
 if(age<recovery)return age<release+(recovery-release)*.5?2:3;
 return age<recovery+(duration-recovery)*.5?4:5;
}
const combat35Registrations=new Map();
function combat35Height(im){
 if(!im.complete||!im.naturalWidth)return 0;
 if(combat35Registrations.has(im))return combat35Registrations.get(im);
 // Last cell of the first skill is the standing recovery reference.
 const c=document.createElement('canvas');c.width=c.height=209;const g=c.getContext('2d');
 g.drawImage(im,1045,0,209,209,0,0,209,209);
 const d=g.getImageData(0,0,209,209).data;let top=209,bottom=-1;
 for(let y=0;y<209;y++)for(let x=0;x<209;x++)if(d[(y*209+x)*4+3]>170){top=Math.min(top,y);bottom=Math.max(bottom,y)}
 const height=bottom-top+1;if(height>0)combat35Registrations.set(im,height);return height;
}
