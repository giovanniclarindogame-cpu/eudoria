'use strict';
const ORIGINAL_REWORK_KITS=[
{skin:0,key:'astral',resource:'Ki',style:'Ki e transformação',color:'#ffd76c',summary:'Carregue energia e troque golpes para passar de Base a Desperto e Supremo. Os efeitos evoluem com o estágio.',skills:[
['Rajada de Ki','De 3 a 7 esferas conforme o estágio. Gasta 10 Ki. No Supremo, as últimas esferas explodem em uma pequena área.',3,470,.18,.8,'volley'],
['Combo Relâmpago','Avança com o punho à frente. Ao alcançar um inimigo, desfere de 4 a 8 socos conforme o estágio. Se errar, perde os 18 Ki e encerra o avanço. Obstáculos bloqueiam o dash.',6,260,.15,.95,'combo'],
['Onda Concentrada','Segure 3 por até 1,5s e solte: feixe de 90 a 240 de dano, mais forte e largo nos estágios altos. Gasta 20 Ki; alcance de 380 a 500.',7,500,.2,1.05,'beam'],
['Passo Instantâneo','Teleporte curto de 150 a 210 conforme o estágio. Gasta 8 Ki e cancela a animação atual, inclusive cargas. Breve invulnerabilidade na saída.',5,210,.075,.25,'teleport'],
['Carregar Aura','Segure 5 para recuperar 30 Ki por segundo. Com 40 Ki desperta; com 80 chega ao Supremo. Fica parado e recebe 20% mais dano durante a carga.',1,0,.1,.4,'aura'],
['Esfera Solar','Gasta 35 Ki. Após preparar, a esfera cai do céu na área escolhida. O estágio aumenta seu raio de 80 a 150 e o dano de 220 a 360.',25,420,1,1.95,'sky']
]},
{skin:1,key:'ninja',resource:'Cópia',style:'Adaptação e armadilha',color:'#8ccfff',summary:'Prepare o olho para guardar o próximo golpe especial recebido. Use a tecla 5 outra vez para devolver uma cópia.',skills:[
['Lâmina Rápida','Corte veloz de 60 de dano, alcance 95. Recuperação curta para iniciar uma sequência.',2,95,.12,.4,'slash'],
['Clone de Fumaça','Recuo curto e um duplo com 80 HP por 3s. O clone atrai a mira inimiga e ataca até três vezes por 22 de dano.',9,0,.22,.65,'seal'],
['Selo Elétrico','Coloca uma armadilha visível no chão, até 220 de distância, por 8s. Causa 55 de dano e paralisa por 1,2s ao ser pisada. Até duas armadilhas.',8,220,.3,.7,'ground'],
['Troca de Lugar','Troca com seu clone ou intercepta um projétil inimigo até 340. Dissipa o projétil e deixa fumaça; exige destino livre.',8,340,.08,.4,'teleport'],
['Olho Copiador','Abre uma janela de 6s para copiar o próximo especial que causar dano. Com uma cópia guardada, 5 a usa uma vez com 75% do dano, sem pagar o recurso original e com metade da recarga original.',10,0,.2,.5,'eye'],
['Golpe Trovão','Avança até 340, causando 230 de dano uma vez por alvo. Com uma cópia guardada, consome-a para liberar seu efeito ao final da investida.',26,340,.35,1.15,'dash']
]},
{skin:2,key:'ronin',resource:'Pressão',style:'Espada e transformação',color:'#f0859c',summary:'Cortes acumulam Pressão Espiritual e tornam a espada mais pesada. Libere a reserva em uma onda ou em sua forma sombria.',skills:[
['Corte Largo','Corte de 78 de dano que empurra. A Pressão aumenta o alcance de 110 a 150 e o peso da espada. Acertos geram 14 de Pressão.',3,150,.26,.65,'slash'],
['Corte em Cruz','Dois cortes de 42 de dano. Reduz a stamina da guarda e aumenta o dano contra alvos defendendo. Cada acerto gera Pressão.',5,115,.18,.7,'cross'],
['Onda Espiritual','Exige 15 de Pressão e consome toda a barra. Dispara uma lâmina de 70 + 1,5 por ponto de Pressão de dano; alcance e largura também crescem.',7,480,.32,.85,'wave'],
['Passo Fantasma','Desliza até 180 deixando uma imagem residual. Breve invulnerabilidade; interrompido por paredes.',6,180,.08,.5,'dash'],
['Liberar Poder','Gasta 40 de Pressão. Por 7s, forma sombria: +45% de dano, +15% de velocidade e espada ampliada. Uma transformação temporária, sem estágios.',18,0,.32,.75,'aura'],
['Lua Crescente Final','Exige 70 de Pressão e consome toda a barra. Meia-lua de 210 + 1,6 por ponto de dano, que atravessa lutadores e para nas paredes.',27,560,.65,1.5,'crescent']
]},
{skin:3,key:'solar',resource:'Chama',style:'Presença e dano contínuo',color:'#ffad5c',summary:'Acumule queimaduras e mantenha a ofensiva. Até cinco marcas aumentam o próximo especial; a Chama esfria sem acertos.',skills:[
['Corte Flamejante','Corte horizontal de 55 de dano. Aplica queimadura e alimenta a Chama Viva.',3,115,.18,.55,'slash'],
['Tigre de Fogo','Lança um tigre de chamas de 95 de dano até 420. Aplica queimadura; o número de marcas no alvo fortalece o lançamento.',7,420,.3,.8,'tiger'],
['Pilar Ardente','Marca o chão e, após 0,5s, ergue uma coluna de 100 de dano em raio 65, até 320 de distância.',9,320,.3,.85,'ground'],
['Investida Solar','Avança até 260 atravessando o inimigo. Causa 80 de dano uma vez por alvo e deixa queimadura.',7,260,.16,.75,'dash'],
['Respiração Ardente','Por 7s: +30% de dano de fogo. Novas queimaduras duram 7s em vez de 4s. Mantém a postura por um instante ao ativar.',17,0,.3,.65,'aura'],
['Fênix Ardente','Exige 50 de Chama e consome a reserva. Cruza até 600 unidades como uma fênix, causando 240 de dano, com quatro marcas de queimadura em cada alvo atingido.',28,600,.45,1.6,'phoenix']
]},
{skin:4,key:'eclipse',resource:'Barreira',style:'Controle de espaço',color:'#9ccaff',summary:'Absorva projéteis com a barreira, controle a distância e proteja sua energia. Se a barreira quebrar, você fica exposto.',skills:[
['Repulsão','Onda curta de 65 de dano que empurra fortemente. Alcance 135, ideal para abrir distância.',6,135,.2,.6,'push'],
['Atração','Vórtice de 45 de dano até 300 que puxa o rival até 110 unidades, respeitando obstáculos.',9,300,.3,.75,'pull'],
['Esfera Vermelha','Projétil lento de 165 de dano que explode em raio 85. Viaja até 430 e pode ser bloqueado por paredes.',12,430,.45,1,'orb'],
['Teleporte Curto','Aparece ao lado do alvo até 240, com breve invulnerabilidade. Precisa de espaço livre e caminho desobstruído.',10,240,.12,.45,'teleport'],
['Barreira Infinita','Liga ou desliga a barreira de 240 pontos. Absorve projéteis e especiais distantes, reduz sua velocidade em 28%. Ao quebrar, fica 4s exposto. Recarrega desligada após 3s sem absorver dano.',1,0,.16,.4,'barrier'],
['Domínio Vazio','Depois de um aviso de 0,6s, cria uma zona de raio 150 por 3s. Imobiliza inimigos que permanecem dentro e causa 20 de dano por segundo.',32,300,.45,1.4,'domain']
]},
{skin:5,key:'hunter',resource:'Pacto',style:'Carga e explosão',color:'#c6f27a',summary:'Escolha a abertura para carregar. Qualquer dano recebido cancela a carga e perde o poder preparado.',skills:[
['Soco Carregado','Segure 1 por até 1,8s: soco de 65 a 260 de dano, com empurrão crescente. Fica parado; qualquer dano recebido interrompe a carga.',4,125,.18,.75,'charge'],
['Pedra Rápida','Soco curto de 48 de dano, sem carga. Recuperação rápida para criar uma abertura.',1.7,85,.1,.35,'punch'],
['Vara Giratória','Giro completo com a vara de pesca. Causa 70 de dano em volta, raio 125, e afasta o inimigo.',7,125,.25,.7,'spin'],
['Salto Selvagem','Salta até 230 e aterrissa com chute de 95 de dano em raio 65. Aterrissagem limitada pelas paredes.',8,230,.18,.95,'leap'],
['Instinto Animal','Por 6s, a esquiva custa 15 de stamina, recupera 40% mais rápido e ganha 0,12s de invulnerabilidade adicional.',16,0,.25,.55,'instinct'],
['Pacto Total','Transforma-se por um instante em uma forma adulta. Soco de 80 + 70% da vida atual; depois consome 80% da própria vida, preservando ao menos 1 HP.',30,165,.9,1.65,'adult']
]}
];
for(const kit of ORIGINAL_REWORK_KITS){kit.assets='reforged_v10';const c=CHAMPIONS[kit.skin];c.kit=[];c.style=kit.style;c.summary=kit.summary;c.ult=kit.skills[5][0];kit.skills=kit.skills.map((row,slot)=>{const[name,desc,cd,range,release,duration,pose]=row,id=skills.length,rank=slot===5?'S':slot>=3?'A':'B';const s={id,name,desc,cd,range,release,duration,pose,slot,champion:kit.skin,rank,color:kit.color,cost:0,ultimate:slot===5,reworked:true,type:slot===5?'Ultimate':slot===4?'Defesa':'Ataque'};if(kit.skin===0&&[2,4].includes(slot)||kit.skin===5&&slot===0)s.holdMax=kit.skin===5?1.8:slot===4?6:1.5;skills.push(s);RANK_IDS[rank].push(id);c.kit.push(id);return s;});IDENTITY_KITS[kit.skin]=kit;}
// Existing league entries must use the new fixed kits too.
for(let i=0;i<LEAGUE_RIVALS.length;i++)LEAGUE_RIVALS[i].kit=[...CHAMPIONS[i%6].kit];
