'use strict';
/*
 * v72 — descrições das habilidades reescritas, curtas e diretas (o que faz, o número que importa, a mecânica com nome em MAIÚSCULAS).
 * Só as 5 que aparecem na tela do campeão (3 habilidades, ultimate e esquiva/dash) de cada um dos 10 campeões. As outras ficam como estão.
 * Os NÚMEROS (dano, custos, alcances) são lidos do texto atual na hora de carregar, então continuam certos quando o equilíbrio muda;
 * se algum número não for encontrado, a habilidade mantém o texto antigo (nada quebra).
 * Este arquivo carrega por último. ?descr=0 desliga.
 */
(function(){
if(/[?&]descr=0/.test(location.search)||typeof CHAMPIONS==='undefined'||typeof skills==='undefined')return;
const g=(c,re,i=1)=>{const x=re.exec(c);if(!x)throw new Error('número não encontrado: '+re);return x[i]};
const D={
 // ---- 0 · Guerreiro Astral ----
 '0:0':()=>'Rajada de esferas de ki. No Modo Poder sai com mais esferas e metade da recarga.',
 '0:1':()=>'Avança e solta uma sequência de socos. No Modo Poder começa com um teleporte para as costas do alvo.',
 '0:2':()=>'Segure e solte: feixe mais forte conforme a carga. SOLTURA PERFEITA (anel dourado): +25% de dano. No Modo Poder sai carregada.',
 '0:3':()=>'Teleporte curto, invulnerável por um instante. Segure para parar e carregar Ki (recebe 20% mais dano enquanto carrega). Ki cheio = Modo Poder.',
 '0:5':c=>`Gasta 35 Ki. Uma esfera cai do céu na área escolhida; o estágio de Ki aumenta o raio (${g(c,/raio de (\d+) a (\d+)/)}–${g(c,/raio de (\d+) a (\d+)/,2)}) e o dano (${g(c,/dano de (\d+) a (\d+)/)}–${g(c,/dano de (\d+) a (\d+)/,2)}).`,
 // ---- 1 · Ninja das Brumas ----
 '1:0':c=>`Avança e corta (${g(c,/corta por (\d+) de dano/)} de dano). Se acertar, toque de novo em até 0,7s para um retorno (${g(c,/retorno de (\d+) de dano/)}), sem reiniciar a recarga.`,
 '1:1':()=>'Cria um clone que luta sozinho (dano reduzido) e morre com qualquer golpe. Toque de novo para trocar de lugar com ele: o próximo golpe sai PELAS COSTAS (+25% e atordoa).',
 '1:4':()=>'LEITURA: ative logo antes de um golpe acertar (0,45s) para reaparecer atrás do atacante e copiá-lo. Fora da hora, copia o próximo especial que te acertar (usa com 75% do dano).',
 '1:5':c=>`Segure para carregar (até 2s) e solte para avançar rachando o chão: ${g(c,/de (\d+) a (\d+) de dano/)} a ${g(c,/de (\d+) a (\d+) de dano/,2)} de dano conforme a carga (+${g(c,/acrescenta (\d+)/)} com uma cópia guardada).`,
 // ---- 2 · Ronin Carmesim ----
 '2:0':c=>`Avança e corta (${g(c,/corta por (\d+) de dano/)} de dano). Se acertar, toque de novo em até 0,65s para um corte de retorno. SAQUE: após 0,8s sem atacar, o próximo corte sai na hora, com mais alcance e +40% de dano.`,
 '2:2':c=>`Segure até 1,4s e solte uma meia-lua de ${g(c,/meia-lua de (\d+) a (\d+)/)} a ${g(c,/meia-lua de (\d+) a (\d+)/,2)} de dano (alcance 360–480). Custa ${g(c,/Custa (\d+) de Pressão/)} de Pressão; você fica parado ao carregar.`,
 '2:3':c=>`Avança 180, invulnerável por um instante. ESQUIVA PERFEITA: se um golpe ia acertar no início do passo, zera a recarga do Corte Rápido, dá ${g(c,/dá (\d+) de Pressão/)} de Pressão e prepara o Saque.`,
 '2:4':c=>`Custa ${g(c,/Custa (\d+) de Pressão/)} de Pressão. Por 7s: +20% de dano, +15% de velocidade, cortes mais rápidos e onda lunar negra.`,
 '2:5':c=>`Exige ${g(c,/Exige (\d+) de Pressão/)} de Pressão e gasta a barra. Meia-lua negra de ${g(c,/de (\d+) \+ 1,6/)} + 1,6 por ponto de dano; atravessa lutadores (uma vez por alvo). Paredes bloqueiam; recuperação longa.`,
 // ---- 3 · Guardião Solar ----
 '3:0':c=>`Corte horizontal de ${g(c,/de (\d+) de dano/)} de dano. Queima o alvo e alimenta a Chama Viva.`,
 '3:1':c=>`Lança um tigre de chamas (${g(c,/de (\d+) de dano até/)} de dano, alcance 420) que queima; quanto mais marcas no alvo, mais forte o lançamento.`,
 '3:2':c=>`Marca o chão e, após 0,5s, ergue uma coluna de ${g(c,/coluna de (\d+) de dano/)} de dano (raio 65). IGNIÇÃO: consome as brasas do alvo, +${g(c,/\+(\d+) de dano por brasa/)} de dano por brasa (até 4).`,
 '3:3':c=>`Avança até 260 atravessando o inimigo (${g(c,/causa (\d+) de dano/)} de dano) e deixa um rastro de fogo por 3s: quem pisa leva ${g(c,/leva (\d+) de dano a cada/)} de dano a cada 0,5s e ganha uma brasa.`,
 '3:4':()=>null,
 '3:5':c=>`Exige ${g(c,/Exige (\d+) de Chama/)} de Chama e gasta a reserva. Cruza até 600 como uma fênix (${g(c,/causando (\d+) de dano/)} de dano) e deixa 4 marcas de queimadura em cada alvo.`,
 // ---- 4 · Lutador do Eclipse ----
 '4:0':c=>`Onda curta de ${g(c,/Onda curta de (\d+) de dano/)} de dano que empurra forte. CHOQUE NA PAREDE: se o rival bater num obstáculo ou na borda, leva +${g(c,/leva \+(\d+) de dano/)} de dano e fica atordoado por 0,5s.`,
 '4:2':c=>`Projétil lento de ${g(c,/de (\d+) de dano que explode/)} de dano que explode (raio 85). Toque de novo enquanto voa para detonar na hora. Depois da Atração: +20% (combo).`,
 '4:5':c=>`Zona de raio 150 por 3s (aviso de 0,25s) que imobiliza quem fica dentro e causa ${g(c,/causa (\d+) de dano por segundo/)} de dano por segundo.`,
 // ---- 5 · Caçador Espectral ----
 '5:0':c=>`Segure: a carga sobe um nível a cada 0,6s (até 3). Solte: ${g(c,/de (\d+) a (\d+) de dano/)} a ${g(c,/de (\d+) a (\d+) de dano/,2)} de dano conforme o nível. POSTURA FIRME: golpes fracos não interrompem a carga.`,
 '5:1':c=>`Soco curto de ${g(c,/de (\d+) de dano/)} de dano, sem carga e com recuperação rápida.`,
 '5:2':c=>`Giro com a vara: ${g(c,/:\s*(\d+) de dano/)} de dano e afasta quem está perto. FISGADA: quem está na ponta da linha (até 240) é puxado e preso por um instante: hora do Soco Carregado.`,
 '5:3':c=>`Salta até 230 e cai com um chute de ${g(c,/chute de (\d+) de dano/)} de dano. CAÇADA: o atingido vira presa (marca cheia: +24% nos seus golpes por 4s).`,
 '5:5':c=>`Vira a forma adulta por um instante: soco de ${g(c,/Soco de (\d+) \+/)} + 70% da vida atual. Depois gasta 80% da sua vida (sempre deixa 1 HP).`,
 // ---- 6 · Herdeiro da Centelha ----
 '6:0':c=>`Segure até 1,4s e solte: soco de ${g(c,/soco de (\d+) a (\d+)/)} a ${g(c,/soco de (\d+) a (\d+)/,2)} de dano que gera ${g(c,/Gera de (\d+) a (\d+)/)}–${g(c,/Gera de (\d+) a (\d+)/,2)} de Sobrecarga. Acima de 70, usar poder também custa vida. Com 30%+ de carga, solta também uma rajada de vento à distância.`,
 '6:1':c=>`Chute rápido de ${g(c,/Chute rápido de (\d+) de dano/)} de dano. CHUTE DE ALÍVIO: acima de 85 de Sobrecarga, descarrega 20 e causa +40% de dano.`,
 '6:2':c=>`Dois saltos de até 130; o segundo termina com impacto de ${g(c,/impacto de (\d+) de dano/)} de dano. RICOCHETE: bater em parede, coluna ou borda faz quicar (+40% ao impacto por quique).`,
 '6:5':c=>`Exige 85 de Sobrecarga. Soco de ${g(c,/Soco de (\d+) de dano/)} de dano que gasta a barra e quebra seu braço por 6s.`,
 // ---- 7 · Corsário da Maré ----
 '7:0':c=>`Braço de água em linha: ${g(c,/em linha: (\d+) de dano/)} de dano. ARPÃO FISGADO: se acertar, toque de novo em até 0,8s para se puxar até o rival e chegar socando (${g(c,/soco de (\d+)/)} de dano).`,
 '7:1':c=>`De 3 a 8 socos curtos de ${g(c,/curtos de (\d+) de dano/)} de dano, conforme a Elasticidade. Cada acerto soma 3 à barra.`,
 '7:2':c=>`Gasta metade da Elasticidade. Dois punhos de água: ${g(c,/causam (\d+) de dano/)} de dano + 1,4 por ponto gasto, e forte empurrão. RESSACA (50+): a onda volta e arrasta o rival para perto.`,
 '7:3':c=>`Prende a fita numa coluna, parede ou borda e se lança até 320. O impacto causa ${g(c,/causa (\d+) de dano/)} de dano e devolve 30 de Elasticidade.`,
 '7:5':()=>'Exige 40+ de Elasticidade e gasta toda a barra. Punho gigante de água em área: quanto mais Elasticidade, maior o alcance, o tamanho e o dano.',
 // ---- 8 · Cavaleiro do Firmamento ----
 '8:0':c=>`Três socos de ${g(c,/Três socos de (\d+) de dano/)} de dano. Cada acerto sobe o combo (a próxima sequência sai mais rápida) e enche o Cosmo. Rival no ar leva +30%.`,
 '8:1':c=>`Gasta ${g(c,/Gasta (\d+) de Cosmo/)} de Cosmo. Cometa de ${g(c,/Cometa de (\d+) de dano/)} de dano (alcance 390). Rival no ar: +30%; consome a marca Exposto (+20%).`,
 '8:2':c=>`Gasta ${g(c,/Gasta (\d+) de Cosmo/)} de Cosmo. Chute de ${g(c,/Chute de (\d+) de dano/)} de dano que lança o rival ao ar por 0,7s e consome a marca Exposto (+20%).`,
 '8:3':c=>`Sem custo. Atravessa o rival (até 230), causa ${g(c,/causa (\d+) de dano/)} de dano e o deixa Exposto por 2s (+25% de dano recebido).`,
 '8:5':c=>`Gasta todo o Cosmo (mínimo 50). 7 ou 9 meteoros de ${g(c,/meteoros de (\d+)/)} perseguem o alvo e um final de ${g(c,/final de (\d+)/)} fecha a constelação; mais forte a cada estágio de Cosmo.`,
 // ---- 9 · Alquimista de Aço ----
 '9:0':c=>`Cria um bloco de pedra à frente (até 6, duram 12s). Com um bloco seu na mira, arremessa-o: ${g(c,/arremessa o bloco: (\d+) de dano/)} de dano (aço: +50% e atravessa). Bater em parede o estilhaça (66 em volta).`,
 '9:1':c=>`Corte em arco de ${g(c,/arco de (\d+) de dano/)} de dano. LANÇA DOS BLOCOS: cada bloco seu a até 160 do alvo dispara uma lança (${g(c,/\((\d+), ou/)}, ou ${g(c,/ou (\d+) se for aço/)} se for aço; até 4).`,
 '9:3':c=>`Ergue uma muralha de ${g(c,/muralha de (\d+) HP/)} HP por 12s. Erguida sob o rival, lança e prende por 0,5s (${g(c,/prende por 0,5s \((\d+) de dano/)} de dano). Quem encosta leva espinhos (${g(c,/espinhos \((\d+) e/)}) e fica lento.`,
 '9:5':()=>'Exige a Essência da Forja cheia e 1+ bloco seu. Funde seus blocos num gigante por 8s; cada material aumenta tamanho, vida e força.'
};
const ant={};   // textos antigos (para voltar atrás: DescricoesV72.voltar())
let trocadas=0,mantidas=[];
for(const [chave,fn] of Object.entries(D)){
 const [h,i]=chave.split(':').map(Number),c=CHAMPIONS[h],sid=c&&c.kit[i],s=sid!=null&&skills[sid];if(!s)continue;
 const cur=String(s.desc||'');
 try{const novo=fn(cur);if(novo&&novo!==cur){ant[sid]=cur;s.desc=novo;s.v72desc=true;trocadas++}}
 catch(e){mantidas.push(chave+' ('+String(e.message).slice(0,40)+')')}
}
if(mantidas.length)console.warn('[Eldoria] descrições mantidas no texto antigo:',mantidas.join(', '));
window.DescricoesV72={trocadas,mantidas,voltar(){for(const [sid,t] of Object.entries(ant))skills[sid].desc=t}};
})();
