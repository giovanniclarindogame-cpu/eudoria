'use strict';
// Four new kits. Resource costs are deliberately independent of the old MP system.
const REWORK_KITS=[
 {key:'spark',skin:6,resource:'Sobrecarga',style:'Risco e recompensa',color:'#67efa6',summary:'Equilibre força, vida e Sobrecarga. Chutes aliviam a pressão; abusar dos braços os bloqueia.',skills:[
  ['Impacto Esmeralda','Segure 1 por até 1,4s e solte: soco de 65 a 190 de dano. Gera de 10 a 34 de Sobrecarga. Acima de 70, usar poder também custa vida.',3,105,.18,.65,'punch'],
  ['Chute Relâmpago','Chute rápido de 48 de dano. Reduz 14 de Sobrecarga e continua disponível com o braço lesionado.',1.1,92,.12,.4,'kick'],
  ['Salto Ricochete','Dois saltos de até 130 cada, respeitando paredes. O segundo termina com impacto de 95 de dano. Gera 15 de Sobrecarga.',7,260,.18,1.1,'leap'],
  ['Estalo de Vento','Dispara vento comprimido: 78 de dano, alcance 430. Gera 18 de Sobrecarga; o dedo fica indisponível por 5s.',1,430,.22,.6,'shot'],
  ['Corpo Energizado','Liga ou desliga o poder. +30% de velocidade e +25% de dano; gera 18 de Sobrecarga e perde 15 HP por segundo. Ao exceder 100, desliga e lesiona o braço.',1,0,.18,.45,'buff'],
  ['Limite Rompido','Exige 100 de Sobrecarga e braço recuperado. Soco de 410 de dano; consome a barra, deixa no máximo 5% de HP e lesiona o braço por 4s.',25,150,.6,1.35,'smash']
 ]},
 {key:'tide',skin:7,resource:'Elasticidade',style:'Alcance e ritmo',color:'#ffc18c',summary:'Estique os golpes para ganhar alcance e velocidade. Elasticidade alta também aumenta o dano e o empurrão recebidos.',skills:[
  ['Soco Elástico','Soco em linha: 65 de dano e alcance de 220 a 380. Gera 4 de Elasticidade ao esticar e mais 8 ao acertar.',2.5,380,.22,.65,'punch'],
  ['Rajada Flexível','De 3 a 8 socos curtos de 20 de dano, conforme a Elasticidade. Cada acerto acrescenta 3 à barra.',6,260,.18,1.15,'barrage'],
  ['Estouro Duplo','Consome metade da Elasticidade. Dois punhos causam 120 de dano, mais 1,4 por ponto consumido, e forte empurrão.',8,340,.35,.9,'punch'],
  ['Catapulta Humana','Usa uma coluna, parede ou borda como âncora e se lança até 320. Acertar causa 90 de dano e devolve 18 de Elasticidade.',9,320,.22,.95,'leap'],
  ['Modo Turbo','Por 5s: +35% de velocidade e recargas 60% mais rápidas. Perde 15 HP por segundo; depois fica lento e causa menos dano por 2s.',15,0,.18,.45,'buff'],
  ['Punho Titã','Exige ao menos 40 de Elasticidade e consome toda a barra. O soco em área ganha alcance, tamanho e dano com o recurso acumulado.',26,570,.65,1.5,'smash']
 ]},
 {key:'star',skin:8,resource:'Cosmo',style:'Combos e energia cósmica',color:'#a8dcff',summary:'Acertar e receber dano alimenta o Cosmo. Gaste-o em golpes encadeados ou acumule para uma virada.',skills:[
  ['Rajada Estelar','Três socos de 20 de dano. Acertos seguidos aceleram a próxima sequência; errar ou ficar 1,4s sem acertar reinicia o combo. Sem custo de Cosmo.',0,105,.12,.65,'barrage'],
  ['Cometa Veloz','Gasta 18 de Cosmo. Soco com cometa de 100 de dano, alcance 390. Sem recarga além da execução.',0,390,.22,.55,'shot'],
  ['Chute Crescente','Gasta 12 de Cosmo. Chute de 65 de dano que suspende o inimigo por 0,7s e abre espaço para continuar o combo.',0,110,.15,.5,'kick'],
  ['Investida Galopante','Gasta 14 de Cosmo. Atravessa o rival por até 230, causa 55 de dano e o deixa exposto a +25% de dano por 2s.',0,230,.14,.55,'leap'],
  ['Brilho Estelar','Consome o Cosmo guardado (mínimo 25). Converte-o em até +65% de dano e 25% de redução de dano por 4 a 8s.',0,0,.2,.5,'buff'],
  ['Constelação Radiante','Consome o Cosmo guardado (mínimo 35). Chuva de 5 a 11 meteoros de 32 de dano numa área; mais Cosmo aumenta a chuva.',0,350,.5,1.45,'summon']
 ]},
 {key:'steel',skin:9,resource:'Material',style:'Controlador de terreno',color:'#dfc58e',summary:'Crie pedra e metal, recicle seus blocos e use o campo preparado para formar um Colosso destrutível.',skills:[
  ['Palma Forjadora','Cria um bloco de 180 HP à frente, até 10 materiais próprios. Se houver um bloco seu na mira, recicla-o num projétil de 95 de dano.',3,260,.26,.7,'forge'],
  ['Lâmina de Pedra','Corte em arco de 75 de dano. Causa 250 de dano contra construções inimigas.',4,115,.2,.65,'slash'],
  ['Espinhos do Subsolo','Linha de espinhos de 85 de dano. Blocos seus no caminho explodem em estilhaços de 65 de dano. Deixa dois novos blocos no chão.',8,330,.35,1.05,'forge'],
  ['Muralha Instantânea','Ergue parede de 320 HP por 24s. Bloqueia movimento e projéteis. Use a habilidade mirando sua parede para empurrá-la; ataques básicos também a movem.',7,190,.25,.7,'forge'],
  ['Punho de Ferro','Por 6s: +35% de dano e 30% de redução de dano, mas −25% de velocidade.',13,0,.18,.45,'buff'],
  ['Colosso de Pedra','Consome todos os blocos vivos do mapa (mínimo 1). Forma um gigante por 8s; cada material aumenta seu tamanho, vida e força. Inimigos podem destruí-lo.',28,0,.7,1.5,'summon']
 ]}
];
const REWORK_SKILL_START=skills.length;
for(const kit of REWORK_KITS){
 const champ=CHAMPIONS[kit.skin];champ.kit=[];champ.style=kit.style;champ.summary=kit.summary;champ.ult=kit.skills[5][0];
 if(!SKINS[kit.skin])SKINS[kit.skin]={name:champ.name,color:kit.color,desc:kit.summary};
 kit.skills=kit.skills.map((row,slot)=>{const [name,desc,cd,range,release,duration,pose]=row,id=skills.length,rank=slot===5?'S':slot>=3?'A':'B';
  const s={id,name,desc,cd,range,release,duration,pose,slot,champion:kit.skin,rank,color:kit.color,cost:0,ultimate:slot===5,type:slot===5?'Ultimate':slot===4?'Defesa':'Ataque',reworked:true};
  skills.push(s);RANK_IDS[rank].push(id);champ.kit.push(id);return s;
 });
}
const IDENTITY_KITS=Object.fromEntries(REWORK_KITS.map(k=>[k.skin,k]));
function identityKit(skin){return IDENTITY_KITS[skin];}
function reworkKit(a){return identityKit(a?.skin);}
function reworkState(a){return a.identity||(a.identity={value:0,lastGain:0,arm:0,finger:0,empowered:false,turbo:0,tired:0,iron:0,cosmic:0,cosmicPower:0,combo:0,comboTime:0,air:0,exposed:0,charge:null});}
function reworkMaterials(a=null){return objects.filter(o=>o.material&&o.life>0&&o.hp>0&&(!a||o.owner===a));}
function reworkResource(a){const k=reworkKit(a);return k?{label:k.resource,value:a.skin===9?reworkMaterials(a).length:reworkState(a).value,max:a.skin===9?10:100,color:k.color}:null;}
