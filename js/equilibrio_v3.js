'use strict';
/*
 * Equilíbrio de largada (duelos, equipes, Trio, Coroa e liga; não vale no treino, na Cruzada nem na Caçada).
 * Problema: alguns heróis têm a ultimate liberada desde o primeiro segundo (só esperam a recarga) e outros precisam encher um recurso
 * (Pressão, Chama, Sobrecarga, Elasticidade, Cosmo, Essência), então começam com várias habilidades bloqueadas.
 *  - ULT_INICIAL: heróis com ultimate sem recurso começam com ela em recarga (segundos), perto do tempo que os outros levam para encher a barra.
 *  - RECURSO_INICIAL: heróis que começam com habilidades bloqueadas por recurso largam com um pouco dele, para ter o kit básico liberado.
 * Vale a cada início de luta/rodada/reaparecimento (resetFighter), na troca de herói (Trio) e na criação da luta. ?equilibrio=0 desliga (simulações).
 */
(function(){
if(!window.V3Modes)return;
const OFF=/[?&]equilibrio=0/.test(location.search);
const ULT_INICIAL={1:15,4:15,5:15};              // Ninja, Eclipse, Caçador (Goku usa o Ki, que ele mesmo enche)
const RECURSO_INICIAL={2:20,8:25,9:30};          // Ronin (Pressão), Cavaleiro (Cosmo), Alquimista (Essência)
function vale(){return !OFF&&battleActivity!=='training'&&!modeRun&&!arenaModeId}
function aplicar(a){
 try{
  const ehHeroi=window.V3API&&V3API.isHero;if(!a||!vale()||!ehHeroi||!ehHeroi(a)||a.boss||a.trainingDummy)return;
  const h=a.skin,u=ULT_INICIAL[h];
  if(u&&a.kit&&a.kit[5]!=null)a.cd[a.kit[5]]=Math.max(a.cd[a.kit[5]]||0,u);
  const r=RECURSO_INICIAL[h];
  if(r){const s=reworkState(a);if(s&&!(s.value>=r))s.value=r}
 }catch(e){console.warn('[Eldoria] equilíbrio',e)}
}
window.V3Balance={aplicar,ULT_INICIAL,RECURSO_INICIAL,get ativo(){return !OFF}};
})();
