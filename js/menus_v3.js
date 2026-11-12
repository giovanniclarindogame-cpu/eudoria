'use strict';
/* Menus do combate v3: mostram só 3 habilidades + ultimate (o dash vem à parte), como no jogo. */
(function(){
if(!window.COMBAT_V3||!window.V3API)return;
const V2=V3API.V2;
const slotsOf=id=>{const v=V2[id];return v?[...v.s,5]:null};
const champOf=kit=>CHAMPIONS.find(c=>kit?.length===6&&c.kit.every((k,i)=>kit[i]===k));

/* prévia de kit (cartas de campeão, builds salvas) */
const prevPreview=kitPreview;
kitPreview=function(kit){
 const c=champOf(kit),sl=c&&slotsOf(c.id);if(!sl)return prevPreview(kit);
 return `<div class="build-icons">${sl.map(i=>`<span title="${skills[kit[i]].name}" aria-label="${skills[kit[i]].name}">${icon(kit[i])}</span>`).join('')}</div>`;
};

/* início: ícones do campeão selecionado */
const prevBuild=renderLobbyBuild;
renderLobbyBuild=function(){
 prevBuild();
 const c=currentChampion(),sl=c&&slotsOf(c.id),box=document.querySelector('#lobbyBuild .lobby-build-icons');
 if(!sl||!box)return;
 [...box.children].forEach((el,i)=>{if(!sl.includes(i))el.remove()});
 box.setAttribute('aria-label','Ver as habilidades');
 const foot=document.querySelector('#lobbyBuild .lobby-build-foot>span');
 if(foot&&/técnicas/.test(foot.textContent))foot.textContent='3 técnicas + 1 ultimate + dash · HP ≤ 20%';
};

/* detalhe do campeão */
const prevDetails=openChampionDetails;
openChampionDetails=function(id){
 prevDetails(id);
 const el=document.getElementById('heroDetail'),c=CHAMPIONS[Number(id)],sl=c&&slotsOf(c.id);
 if(!el||!sl)return;
 const kit=el.querySelector('.hero-kit');if(!kit)return;
 kit.setAttribute('aria-label','Três habilidades e ultimate');
 const btns=[...kit.querySelectorAll('[data-hero-skill]')];
 btns.forEach(b=>{const i=+b.dataset.heroSkill;if(!sl.includes(i)){b.remove();return}const lab=b.querySelector('small');if(lab)lab.textContent=i===5?'ULT':String(sl.indexOf(i)+1)});
 sl.forEach(i=>{const b=kit.querySelector(`[data-hero-skill="${i}"]`);if(b)kit.appendChild(b)});   // ordem de uso: 1, 2, 3, ULT
 const first=kit.querySelector('[data-hero-skill]');
 if(first){
  kit.querySelectorAll('.active').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});
  first.classList.add('active');first.setAttribute('aria-pressed','true');
  try{detailSkill=+first.dataset.heroSkill;const t=document.getElementById('heroSkillCopy');if(t)t.innerHTML=detailSkillText(c,detailSkill)}catch{}
 }
 const stat=[...el.querySelectorAll('.hero-stat')].find(s=>/HABILIDADES/.test(s.textContent));
 if(stat){const b=stat.querySelector('b');if(b)b.innerHTML='3 <small>+ ULT</small>'}
};
})();
