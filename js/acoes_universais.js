'use strict';
function renderUniversalActions(){
 for(const [id,key,label]of [['attack','attack','ATAQUE'],['dodge','dash','25 ST'],['defend','guard','SEGURE']]){
  const button=document.getElementById(id);if(!button)continue;
  button.innerHTML=`<span class="universal-action-art action-${key}" aria-hidden="true"></span><small>${label}</small>`;
 }
}
const universalActionsStart=start;
start=function(){const result=universalActionsStart();renderUniversalActions();return result;};
renderUniversalActions();
