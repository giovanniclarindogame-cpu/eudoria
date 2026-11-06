'use strict';
// Preparação editorial. Não aplica quedas, dano, atordoamento ou alterações de peso.
// Valores provisórios: revisar junto das animações finais de cada campeão.
const FUTURE_IMPACT_LEVELS=Object.freeze({none:0,light:10,medium:25,strong:50,knockdown:100});
const FUTURE_CHAMPION_IMPACTS=[
 ['light','strong','strong','none','none','knockdown'], // Astral
 ['light','light','medium','none','none','strong'], // Ninja
 ['strong','medium','strong','none','none','knockdown'], // Ronin
 ['medium','strong','strong','medium','none','knockdown'], // Solar
 ['strong','medium','strong','none','none','none'], // Eclipse
 ['strong','light','medium','strong','none','knockdown'], // Caçador
 ['strong','light','strong','medium','none','knockdown'], // Centelha
 ['medium','light','strong','strong','none','knockdown'], // Corsário
 ['light','strong','strong','medium','none','knockdown'], // Cavaleiro
 ['medium','medium','strong','medium','none','knockdown'] // Alquimista
];
for(const champion of CHAMPIONS)for(const [slot,id]of champion.kit.entries()){
 const level=FUTURE_CHAMPION_IMPACTS[champion.id][slot];
 skills[id].futureImpact=Object.freeze({level,posture:FUTURE_IMPACT_LEVELS[level],provisional:true});
}
// Consulta para a futura integração. Sem chamadas no loop de combate atual.
function plannedSkillImpact(id,{charge=0,finalHit=false}={}){
 const skill=skills[id];if(!skill?.futureImpact)return null;
 let level=skill.futureImpact.level;
 if(skill.champion===0&&skill.slot===1)level=finalHit?'knockdown':'light';
 if(skill.champion===0&&skill.slot===2)level=charge>=.95?'knockdown':'medium';
 return {...skill.futureImpact,level,posture:FUTURE_IMPACT_LEVELS[level]};
}
