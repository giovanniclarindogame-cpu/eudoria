'use strict';
/*
 * Os 9 chefes da Caçada do Dia (além do Zorvath). Cada um é um vilão ORIGINAL que remete ao arquétipo de um vilão
 * dos nossos heróis: nome, visual e golpes são próprios. Habilidades = ataques-padrão do motor (js/chefes_motor.js)
 * com parâmetros + uma mecânica única (mech). Para criar outro chefe, copie uma definição e mude os dados.
 */
(()=>{
const L=BOSS_LOOKS;
const ic=(shape,l)=>({shape,c1:l.aura.a,c2:l.aura.b});
const basics=(l,a,b,c)=>[{name:a[0],icon:ic('combo',l),desc:a[1]},{name:b[0]||'Guarda Soberba',icon:ic('guard',l),desc:'O chefe se protege de frente e reduz o dano. Ataque pelas costas ou espere ele baixar a guarda.'},{name:c[0],icon:ic('step',l),desc:c[1]}];
const col=R=>R.def.look.aura;
const TAU=Math.PI*2;

/* ============================== 1 · VHALOR — o mascarado das sombras (vilão do Ninja das Brumas) ============================== */
const vhalor={id:'vhalor',name:'Vhalor, o Mascarado',title:'Mestre das Sombras',look:L.vhalor,hp:3300,hpDuo:4300,stars:4,difficulty:'Alta',speed:122,pref:170,
 story:'Um ninja que apagou o próprio rosto e a própria história. Vhalor atravessa o mundo como fumaça: quando você acha que o acertou, já não está mais lá — e é nesse instante que ele ataca.',
 system:['Fase Etérea','A cada 13s ele fica etéreo por 3,5s: nada o atinge. Ao voltar, fica exposto por um instante e recebe 25% a mais de dano. Gaste habilidades só quando ele estiver sólido.'],systemIcon:ic('blink',L.vhalor),
 tips:['Quando ele ficar translúcido, não gaste habilidades: nada o atinge.','Logo que ele solidifica há uma janela de dano extra. Segure a sua melhor habilidade para esse momento.','Os clones explodem ao tocar em você: corra e deixe-os explodirem longe, ou mate-os antes.','O Passo Etéreo sempre vem por trás: esquive assim que ele sumir.'],
 skills:[
  {id:'s0',name:'Chuva de Kunais',icon:ic('fan',L.vhalor),cd:6,desc:'Leque de lâminas rápidas. Na fúria, mais lâminas e uma segunda rajada.',k:{kind:'fan',n:5,n2:2,spread:.85,speed:430,dmg:40,r:9,shape:'blade',wind:.4,again:.5},ai:{min:110,w:3}},
  {id:'s1',name:'Clones Sombrios',icon:ic('clones',L.vhalor),cd:13,desc:'Cria clones que correm até você e explodem. Afaste-se deles ou mate-os antes.',k:{kind:'clones',n:3,n2:2,dmg:70,r:64,speed:150,life:4.5},ai:{w:2.6}},
  {id:'s2',name:'Bola de Fogo Anelar',icon:ic('ring',L.vhalor),cd:11,desc:'Explosão em volta dele; a segunda onda atinge quem fugiu longe demais.',k:{kind:'ring',r0:150,r:270,dmg:100,wind:.75},ai:{max:260,w:3}},
  {id:'s3',name:'Passo Etéreo',icon:ic('blink',L.vhalor),cd:8,desc:'Some e reaparece atrás de você com um golpe forte. Na fúria, dá dois saltos.',k:{kind:'blink',wind:.4,dmg:105,r:85,hops:1,hops2:1},ai:{min:60,w:3}},
  {id:'s4',name:'Selos Proibidos',icon:ic('mark',L.vhalor),cd:13,desc:'Marca você com um círculo. Quem ficar dentro fica preso e sofre o Passo Etéreo em seguida.',k:{kind:'mark',r:80,delay:1,root:1.4,dmg:55,then:'s3',label:'SELADO'},ai:{w:2.4}},
  {id:'s5',name:'Vórtice do Vazio',icon:ic('vortex',L.vhalor),cd:22,desc:'Abre um vórtice que puxa e fere; no fim, uma explosão no centro.',k:{kind:'pull',r:300,dur:2.4,force:130,dmg:22,tick:.45,slam:{r:120,dmg:110}},ai:{w:2.4,phase:1}}],
 basic:{hits:3,hits2:1,dmgs:[30,34,44,66]},
 basics:basics(L.vhalor,['Golpe das Sombras','Combo de 3 golpes (4 na fúria). O último empurra.'],[''],['Passo de Fumaça','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  init(R){R.mech.phase='solid';R.mech.t=0},
  tick(R,A,dt){const m=R.mech;m.t+=dt;
   if(m.phase==='solid'&&m.t>=13){m.phase='eth';m.t=0;toast('Vhalor ficou etéreo — não adianta atacar!');ring(A.x,A.y,80,col(R).b,.5);spark(A.x,A.y,col(R).a,18)}
   else if(m.phase==='eth'&&m.t>=3.5){m.phase='exposed';m.t=0;toast('Vhalor solidificou — ataque agora!');ring(A.x,A.y,60,'#fff',.4)}
   else if(m.phase==='exposed'&&m.t>=1.4){m.phase='solid';m.t=0}},
  immune:R=>R.mech.phase==='eth',alpha:R=>R.mech.phase==='eth'?.38:1,
  modDamage:(R,n)=>R.mech.phase==='exposed'?n*1.25:n,
  aura:R=>R.mech.phase==='eth'?.9:R.mech.phase==='exposed'?.6:0,
  hud:R=>{const m=R.mech;return m.phase==='eth'?{text:'ETÉREO · IMUNE',meter:1-m.t/3.5,color:'#ffb0a0'}:m.phase==='exposed'?{text:'EXPOSTO · +25% DANO',meter:1,color:'#fff'}:{text:'SÓLIDO · etéreo em '+Math.ceil(13-m.t)+'s',meter:m.t/13}}
 }};

/* ============================== 2 · KUROEN — o espadachim incandescente (vilão do Ronin Carmesim) ============================== */
const kuroen={id:'kuroen',name:'Kuroen, o Incandescente',title:'Espadachim da Lâmina Rubra',look:L.kuroen,hp:3200,hpDuo:4200,stars:4,difficulty:'Alta',speed:130,pref:120,
 story:'O melhor espadachim que já viveu — e o único que foi queimado vivo por quem jurou protegê-lo. Sua lâmina esquenta a cada corte e, quando o fogo toma conta do aço, ninguém aguenta o calor.',
 system:['Brasa na Lâmina','Cada golpe que ele acerta aquece a lâmina. Com 100 de calor ele entra em Lâmina Rubra por 9s: mais rápido, mais forte e deixando fogo no chão por onde corta. Depois esfria.'],systemIcon:ic('buff',L.kuroen),
 tips:['Evite trocar golpes: cada acerto dele aquece a lâmina.','Na Lâmina Rubra ele deixa fogo por onde passa. Não persiga: mantenha distância e espere esfriar.','O Iaijutsu Final tem aviso fino e longo. Saia da linha ou esconda-se atrás de um pilar.','Ele é rápido de perto, mas lento para recuperar depois da investida.'],
 skills:[
  {id:'s0',name:'Corte Giratório',icon:ic('blast',L.kuroen),cd:5,desc:'Corte em círculo ao redor dele. Mantenha distância.',k:{kind:'blast',r:120,dmg:85,wind:.5,knock:100},ai:{max:170,w:4}},
  {id:'s1',name:'Onda Cortante',icon:ic('fan',L.kuroen),cd:6.5,desc:'Lâmina de energia que atravessa tudo. Na fúria, são três.',k:{kind:'fan',n:1,n2:2,spread:.5,speed:540,dmg:75,r:16,shape:'blade',pierce:true,wind:.4},ai:{min:120,w:3}},
  {id:'s2',name:'Investida de Aço',icon:ic('dash',L.kuroen),cd:8.5,desc:'Avança numa linha marcada. Na Lâmina Rubra, deixa fogo no caminho.',k:{kind:'dash',dmg:120,w:50,min:300,max:520,rec:.6},ai:{min:110,max:520,w:3}},
  {id:'s3',name:'Pilares de Brasa',icon:ic('zone',L.kuroen),cd:12,desc:'Marca o chão e ergue colunas de fogo que queimam por alguns segundos.',k:{kind:'zone',n:3,n2:2,r:58,dur:4.5,dmg:16,delay:.9,aim:'foes',kind2:'fire'},ai:{w:2.6}},
  {id:'s4',name:'Corte em Cruz',icon:ic('blink',L.kuroen),cd:10,desc:'Desaparece e corta duas vezes, atrás de você.',k:{kind:'blink',wind:.35,dmg:80,r:80,hops:2,hops2:0},ai:{min:60,w:3}},
  {id:'s5',name:'Iaijutsu Final',icon:ic('beam',L.kuroen),cd:20,desc:'Longa preparação e um único corte fino e letal por uma linha enorme. Pilares bloqueiam.',k:{kind:'beam',w:34,dmg:260,charge:1.6,track:3,dur:.3,len:900,shots2:1,charge2:.9},ai:{min:180,w:3}}],
 basic:{hits:3,hits2:1,dmgs:[32,36,46,70]},
 basics:basics(L.kuroen,['Combo de Espada','Combo de 3 cortes (4 na fúria). O último empurra.'],[''],['Passo de Lâmina','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  init(R){R.mech.heat=0;R.mech.blaze=0},
  onLanded(R){const m=R.mech;if(m.blaze>0)return;m.heat=Math.min(100,m.heat+7);if(m.heat>=100){m.heat=0;m.blaze=9;R.buff={t:9,spd:1.18,dmg:1.2};toast('Kuroen incendiou a lâmina! Lâmina Rubra por 9s.');ring(R.a.x,R.a.y,100,col(R).b,.5);spark(R.a.x,R.a.y,col(R).a,24)}},
  tick(R,A,dt){const m=R.mech;if(m.blaze>0){m.blaze-=dt;if(m.blaze<=0){m.blaze=0;toast('A lâmina esfriou.')}}else m.heat=Math.max(0,m.heat-1.2*dt)},
  onSwing(R,A,an){if(R.mech.blaze>0)BossKit.addZone(R,{x:A.x+Math.cos(an)*54,y:A.y+Math.sin(an)*54,r:34,delay:0,dur:3,tick:.4,dmg:14,color:col(R).a,kind:'fire'})},
  trail:R=>R.mech.blaze>0?{r:36,dur:3,dmg:14}:null,
  aura:R=>R.mech.blaze>0?1:R.mech.heat/160,
  hud:R=>{const m=R.mech;return m.blaze>0?{text:'LÂMINA RUBRA · '+Math.ceil(m.blaze)+'s',meter:m.blaze/9,color:'#ffd27a'}:{text:'CALOR '+Math.floor(m.heat)+'/100',meter:m.heat/100}}
 }};

/* ============================== 3 · NYXAR — o senhor do crepúsculo (vilão do Guardião Solar) ============================== */
const nyxar={id:'nyxar',name:'Nyxar, o Crepúsculo',title:'Senhor das Sombras Eternas',look:L.nyxar,hp:3500,hpDuo:4500,stars:5,difficulty:'Extrema',speed:112,pref:210,
 story:'Dizem que o sol só nasce porque Nyxar permite. Ele não luta contra a luz: ele a apaga, e só quem se abriga no último brilho do dia ainda respira.',
 system:['Eclipse','A cada 16s a arena escurece por 8s. Quem estiver fora do Círculo de Luz sofre dano contínuo e Nyxar bate 25% mais forte. O círculo se move devagar: acompanhe-o.'],systemIcon:ic('system',L.nyxar),
 tips:['No Eclipse, fique sempre dentro do círculo de luz: lá fora o dano é contínuo.','O Julgamento do Crepúsculo pode ser interrompido com muito dano de uma só vez.','O Manto da Noite cria um escudo: quebre-o antes de atacar a vida.','Os orbes de alma perseguem. Use esquiva quando chegarem perto.'],
 skills:[
  {id:'s0',name:'Lança Sombria',icon:ic('beam',L.nyxar),cd:8,desc:'Raio escuro que trava a mira. Na fúria, dispara duas vezes.',k:{kind:'beam',w:44,dmg:180,charge:.9,track:4,dur:.35,shots2:1,charge2:.55},ai:{min:120,w:3}},
  {id:'s1',name:'Almas Errantes',icon:ic('orbit',L.nyxar),cd:9,desc:'Orbes giram ao redor dele e depois perseguem você.',k:{kind:'orbit',n:4,n2:2,hold:1.5,dmg:46,speed:280,homing:2.6},ai:{w:3}},
  {id:'s2',name:'Manto da Noite',icon:ic('buff',L.nyxar),cd:18,desc:'Escudo de 250 e mais velocidade por 8s. Quebre o escudo antes de atacar a vida.',k:{kind:'buff',dur:8,spd:1.2,dmg:1.15,shield:250,label:'Manto da Noite',r:140},ai:{w:2.4},cond:R=>!(R.shield>0)},
  {id:'s3',name:'Queda do Véu',icon:ic('rain',L.nyxar),cd:12,desc:'Marca vários pontos e derruba trevas em ondas, deixando sombra no chão.',k:{kind:'rain',waves:2,waves2:1,per:2,r:62,dmg:90,delay:1,rand:1,leave:{dmg:10,dur:3,kind:'dark'}},ai:{w:2.6}},
  {id:'s4',name:'Grito Fúnebre',icon:ic('blast',L.nyxar),cd:11,desc:'Onda de choque que empurra para longe.',k:{kind:'blast',r:190,dmg:100,wind:.8,knock:100},ai:{max:260,w:3}},
  {id:'s5',name:'Julgamento do Crepúsculo',icon:ic('nova',L.nyxar),cd:28,desc:'Carrega uma esfera de trevas sobre uma área enorme. Interrompa com muito dano ou saia da área.',k:{kind:'nova',charge:3,r:300,dmg:320,interrupt:400,label:'Julgamento do Crepúsculo'},ai:{w:3.4}}],
 basic:{hits:3,hits2:1,dmgs:[30,34,44,66]},
 basics:basics(L.nyxar,['Golpe da Lança','Combo de 3 golpes (4 na fúria). O último empurra.'],[''],['Véu','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  init(R){const m=R.mech;m.phase='day';m.t=0;m.light={x:W/2,y:H/2,tx:W/2,ty:H/2,r:125};m.acc=0},
  tick(R,A,dt){const m=R.mech;m.t+=dt;
   if(m.phase==='day'&&m.t>=16){m.phase='eclipse';m.t=0;m.light.x=clamp(W*(.3+Math.random()*.4),120,W-120);m.light.y=clamp(H*(.35+Math.random()*.3),120,H-120);m.light.tx=m.light.x;m.light.ty=m.light.y;toast('Eclipse! Fique dentro do círculo de luz.')}
   else if(m.phase==='eclipse'){
    const L=m.light;if(Math.hypot(L.tx-L.x,L.ty-L.y)<8){L.tx=clamp(W*(.2+Math.random()*.6),120,W-120);L.ty=clamp(H*(.3+Math.random()*.4),120,H-120)}
    const an=Math.atan2(L.ty-L.y,L.tx-L.x);L.x+=Math.cos(an)*55*dt;L.y+=Math.sin(an)*55*dt;
    m.acc+=dt;if(m.acc>=.6){m.acc=0;for(const t of BossKit.foes(A))if(Math.hypot(t.x-L.x,t.y-L.y)>L.r)BossKit.bossHit(R,t,16,0,0,{zone:true})}
    if(m.t>=8){m.phase='day';m.t=0;toast('O eclipse acabou.')}}},
  dmgMul:R=>R.mech.phase==='eclipse'?1.25:1,aura:R=>R.mech.phase==='eclipse'?.7:0,
  drawWorld(R){const m=R.mech;if(m.phase!=='eclipse')return;const L=m.light,fade=Math.min(1,m.t/1,(8-m.t)/1);
   ctx.save();ctx.globalAlpha=.5*fade;ctx.fillStyle='#04021a';ctx.beginPath();ctx.rect(0,0,W,H);ctx.arc(L.x,L.y,L.r,0,TAU,true);ctx.fill('evenodd');
   ctx.globalAlpha=fade;ctx.strokeStyle='#ffd9a0';ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.lineDashOffset=-clock*30;ctx.beginPath();ctx.arc(L.x,L.y,L.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
   ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(L.x,L.y,10,L.x,L.y,L.r);g.addColorStop(0,'rgba(255,200,120,.22)');g.addColorStop(1,'rgba(255,160,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(L.x,L.y,L.r,0,TAU);ctx.fill();ctx.restore()},
  hud:R=>{const m=R.mech;return m.phase==='eclipse'?{text:'ECLIPSE · '+Math.ceil(8-m.t)+'s',meter:1-m.t/8,color:'#ffb24a'}:{text:'CREPÚSCULO · eclipse em '+Math.ceil(16-m.t)+'s',meter:m.t/16}}
 }};

/* ============================== 4 · RYOKU — o rei das maldições (vilão do Lutador do Eclipse) ============================== */
const ryoku={id:'ryoku',name:'Ryoku, Rei das Maldições',title:'Soberano do Santuário Maligno',look:L.ryoku,hp:3600,hpDuo:4600,stars:5,difficulty:'Extrema',speed:128,pref:190,
 story:'Mil anos atrás ele foi tão cruel que as próprias maldições o coroaram. Ryoku ri enquanto corta o mundo em pedaços e, quando se cansa de brincar, abre o Santuário Maligno.',
 system:['Domínio Maligno','Periodicamente ele abre o Domínio: uma zona enorme que fere e desacelera. Cause dano suficiente a ele para quebrá-lo (e atordoá-lo), ou saia da área.'],systemIcon:ic('system',L.ryoku),
 tips:['Quando o Domínio abrir, concentre dano nele: quebrando, ele fica atordoado.','Os cortes do Desmantelar são rápidos. Contorne pela lateral.','Maldição Ancestral prende você; o golpe seguinte vem forte.','O Corte do Mundo atinge quem se afasta: entre no anel interno logo após a primeira onda.'],
 skills:[
  {id:'s0',name:'Desmantelar',icon:ic('fan',L.ryoku),cd:5.5,desc:'Rajada de cortes finos e rápidos. Na fúria, ainda mais cortes.',k:{kind:'fan',n:7,n2:4,spread:1.2,speed:520,dmg:34,r:9,shape:'blade',wind:.35},ai:{min:100,max:480,w:3}},
  {id:'s1',name:'Clivar',icon:ic('dash',L.ryoku),cd:8,desc:'Corte pesado em linha reta, muito rápido.',k:{kind:'dash',dmg:140,w:44,min:320,max:520,wind:.5,speed:1500,rec:.5},ai:{min:110,w:3}},
  {id:'s2',name:'Fuga',icon:ic('beam',L.ryoku),cd:9,desc:'Flecha de fogo que trava a mira e causa dano alto.',k:{kind:'beam',w:40,dmg:170,charge:.8,track:5,dur:.35,shots2:1,charge2:.5},ai:{min:130,w:3}},
  {id:'s3',name:'Maldição Ancestral',icon:ic('mark',L.ryoku),cd:12,desc:'Prende quem ficar no círculo e corta em seguida com o Clivar.',k:{kind:'mark',r:74,delay:.9,root:1.3,dmg:70,then:'s1',label:'AMALDIÇOADO'},ai:{w:2.4}},
  {id:'s4',name:'Corte do Mundo',icon:ic('ring',L.ryoku),cd:13,desc:'Onda de corte em volta dele; a segunda atinge quem fugiu.',k:{kind:'ring',r0:170,r:280,dmg:95,wind:.8},ai:{max:260,w:3}},
  {id:'s5',name:'Domínio: Santuário Maligno',icon:ic('nova',L.ryoku),cd:28,desc:'Zona enorme que fere e desacelera por 6s. Quebre com 360 de dano ou saia dela.',k:{kind:'domain',r:300,dur:6,dmg:30,wind:1.2,break:360},ai:{w:3.4}}],
 basic:{hits:3,hits2:1,dmgs:[30,34,44,66]},
 basics:basics(L.ryoku,['Golpe do Rei','Combo de 3 golpes (4 na fúria). O último empurra.'],[''],['Passo Maldito','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  hud:R=>{const s=R.zones.find(z=>z.domain);if(s&&s.t>=s.delay)return{text:'DOMÍNIO · quebrar: '+Math.max(0,Math.round((R.domainBreak||360)-(R.domainDmg||0))),meter:1-(R.domainDmg||0)/(R.domainBreak||360),color:'#ff9ac4'};
   const cd=R.def.skills[5].cd;return{text:'MALDIÇÃO · domínio em '+Math.max(0,Math.ceil(R.cds.s5))+'s',meter:1-Math.max(0,R.cds.s5)/cd}},
  aura:R=>R.zones.some(z=>z.domain&&z.t>=z.delay)?.9:0
 }};

/* ============================== 5 · XERATH — o rei quimera (vilão do Caçador Espectral) ============================== */
const xerath={id:'xerath',name:'Xerath, Rei Quimera',title:'Predador Adaptável',look:L.xerath,hp:3400,hpDuo:4400,stars:4,difficulty:'Alta',speed:136,pref:170,
 story:'Nasceu como um inseto e devorou tudo até virar rei. Xerath aprende com cada golpe que sofre: se você repete o mesmo ataque, o corpo dele já se acostumou.',
 system:['Adaptação','Quando você acerta o mesmo golpe várias vezes seguidas, ele ganha resistência (até 60%). Alterne as habilidades para zerar a adaptação.'],systemIcon:ic('system',L.xerath),
 tips:['Não repita a mesma habilidade: a resistência dele sobe a cada acerto igual.','Alternar entre 2 ou 3 habilidades mantém o dano alto.','O Voo Predador deixa ele exposto logo depois: contra-ataque.','O Enxame persegue: use o DASH quando chegar perto.'],
 skills:[
  {id:'s0',name:'Rajada de Espinhos',icon:ic('fan',L.xerath),cd:6,desc:'Leque de espinhos rápidos. Na fúria, mais espinhos e uma segunda rajada.',k:{kind:'fan',n:6,n2:3,spread:.95,speed:460,dmg:38,r:9,shape:'blade',wind:.4,again:.5},ai:{min:110,w:3}},
  {id:'s1',name:'Voo Predador',icon:ic('dash',L.xerath),cd:8.5,desc:'Mergulho rápido numa linha marcada.',k:{kind:'dash',dmg:125,w:56,min:320,max:540,speed:1300,rec:.6},ai:{min:110,w:3}},
  {id:'s2',name:'Enxame',icon:ic('orbit',L.xerath),cd:10,desc:'Insetos giram ao redor dele e depois perseguem você.',k:{kind:'orbit',n:5,n2:3,hold:1.4,dmg:44,speed:320,homing:3},ai:{w:3}},
  {id:'s3',name:'Ferrão Real',icon:ic('beam',L.xerath),cd:9.5,desc:'Raio concentrado que trava a mira. Na fúria, dispara duas vezes.',k:{kind:'beam',w:38,dmg:175,charge:.9,track:4,dur:.35,shots2:1,charge2:.55},ai:{min:130,w:3}},
  {id:'s4',name:'Regeneração',icon:ic('buff',L.xerath),cd:17,desc:'Recupera um pouco de vida e ganha escudo e velocidade por 7s.',k:{kind:'buff',dur:7,spd:1.15,dmg:1.1,shield:180,heal:.06,label:'Regeneração',r:110},ai:{w:2.2},cond:(R,A)=>A.hp<A.max*.85},
  {id:'s5',name:'Pulso Real',icon:ic('ring',L.xerath),cd:14,desc:'Anel de choque que atinge também quem se afastou.',k:{kind:'ring',r0:190,r:300,dmg:105,wind:.8},ai:{max:260,w:3}}],
 basic:{hits:3,hits2:1,dmgs:[32,36,46,70]},
 basics:basics(L.xerath,['Garras','Combo de 3 golpes (4 na fúria). O último empurra.'],[''],['Salto Rápido','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  init(R){R.mech.last=null;R.mech.streak=0},
  resist(R,id){const m=R.mech;return(id!==undefined&&id===m.last)?Math.min(.6,.12*m.streak):0},
  modDamage(R,n,id){return n*(1-R.def.mech.resist(R,id))},
  onHurt(R,dmg,id){const m=R.mech;if(id===m.last)m.streak++;else{m.last=id;m.streak=1}if(m.streak===4)float(R.a.x,R.a.y-90,'ADAPTANDO','#c8ffe0')},
  hud:R=>{const m=R.mech,res=m.streak>1?Math.min(.6,.12*(m.streak-1)):0;return{text:'ADAPTAÇÃO '+Math.round(res*100)+'%',meter:res/.6,color:'#7aff9a'}},
  aura:R=>Math.min(.8,R.mech.streak*.12)
 }};

/* ============================== 6 · RAPINA — o usurpador (vilão do Herdeiro da Centelha) ============================== */
const rapina={id:'rapina',name:'Lord Rapina',title:'O Usurpador de Poderes',look:L.rapina,hp:3500,hpDuo:4500,stars:5,difficulty:'Extrema',speed:116,pref:200,
 story:'Ele nunca criou um poder: roubou todos. Rapina colhe força de quem toca e a guarda como armadura — e cada herdeiro que ele derrota o deixa mais forte.',
 system:['Roubo de Vigor','Cada golpe que ele acerta rouba stamina e vira escudo (até 500). O escudo absorve dano antes da vida: quebre-o com golpes fortes ou não deixe que ele acerte.'],systemIcon:ic('system',L.rapina),
 tips:['Não deixe que ele acerte: cada golpe vira escudo.','Quando o escudo estiver cheio, use as suas habilidades mais fortes para quebrá-lo de uma vez.','A Mão Estendida puxa você: use o DASH no meio para sair do vórtice.','O Fim da Linha pode ser interrompido com muito dano de uma só vez.'],
 skills:[
  {id:'s0',name:'Onda de Pressão',icon:ic('blast',L.rapina),cd:5,desc:'Onda de choque curta ao redor dele.',k:{kind:'blast',r:140,dmg:85,wind:.5,knock:110},ai:{max:190,w:4}},
  {id:'s1',name:'Mão Estendida',icon:ic('vortex',L.rapina),cd:11,desc:'Puxa você para perto e fere; no fim, uma explosão.',k:{kind:'pull',r:260,dur:1.6,force:150,dmg:28,tick:.4,slam:{r:110,dmg:100}},ai:{w:2.8}},
  {id:'s2',name:'Raio Disperso',icon:ic('fan',L.rapina),cd:6.5,desc:'Leque de raios. Na fúria, mais raios e uma segunda rajada.',k:{kind:'fan',n:7,n2:3,spread:1.2,speed:400,dmg:36,r:10,wind:.45,again:.5},ai:{min:110,w:3}},
  {id:'s3',name:'Saque de Vigor',icon:ic('mark',L.rapina),cd:12,desc:'Marca você; quem ficar no círculo é drenado e sofre a Onda de Pressão.',k:{kind:'mark',r:80,delay:.9,root:.9,dmg:50,then:'s0',label:'DRENADO'},ai:{w:2.4}},
  {id:'s4',name:'Fusão',icon:ic('buff',L.rapina),cd:20,desc:'Escudo de 300 e mais força por 9s.',k:{kind:'buff',dur:9,spd:1.15,dmg:1.15,shield:300,label:'Fusão',r:120},ai:{w:2.4},cond:R=>!(R.shield>0)},
  {id:'s5',name:'Fim da Linha',icon:ic('nova',L.rapina),cd:30,desc:'Esfera de energia roubada sobre uma área enorme. Interrompa com muito dano.',k:{kind:'nova',charge:3.2,r:320,dmg:340,interrupt:440,label:'Fim da Linha'},ai:{w:3.4}}],
 basic:{hits:3,hits2:1,dmgs:[30,34,44,66]},
 basics:basics(L.rapina,['Punho do Usurpador','Combo de 3 golpes (4 na fúria). O último empurra.'],[''],['Passo Roubado','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  onLanded(R,t,n){R.shield=Math.min(500,(R.shield||0)+n*.25);t.st=Math.max(0,t.st-12)},
  hud:R=>({text:'ESCUDO '+Math.round(R.shield||0)+'/500',meter:(R.shield||0)/500,color:'#9fb2ff'}),
  aura:R=>(R.shield||0)/600
 }};

/* ============================== 7 · MALRATH — o capitão devorador (vilão do Corsário da Maré) ============================== */
const malrath={id:'malrath',name:'Capitão Malrath',title:'O Devorador dos Sete Mares',look:L.malrath,hp:3800,hpDuo:4800,stars:5,difficulty:'Extrema',speed:108,pref:170,
 story:'Seu navio não tem bandeira: tem fome. Malrath puxa tudo para perto — o butim, os rivais e a própria sorte — e depois esmaga o que sobrou.',
 system:['Gravidade','A cada 12s ele emite um Pulso Gravitacional que puxa todo mundo para perto e termina em uma pancada forte. Esquive logo antes da pancada ou fuja do raio.'],systemIcon:ic('vortex',L.malrath),
 tips:['No Pulso Gravitacional, resista indo para longe e esquive no instante da pancada.','O Canhão do Capitão é lento: dá tempo de sair da linha.','A Maré Negra deixa poças que ferem: não fique parado.','Ele é o mais resistente da caçada: seja paciente.'],
 skills:[
  {id:'s0',name:'Rajada de Pólvora',icon:ic('fan',L.malrath),cd:6,desc:'Disparos de pistola em leque. Na fúria, mais disparos e uma segunda rajada.',k:{kind:'fan',n:5,n2:3,spread:.7,speed:440,dmg:42,r:11,wind:.45,again:.5,c:'#ffb24a',c2:'#fff0a0'},ai:{min:110,w:3}},
  {id:'s1',name:'Abordagem',icon:ic('dash',L.malrath),cd:8.5,desc:'Investida pesada numa linha marcada.',k:{kind:'dash',dmg:130,w:62,min:320,max:520,speed:1100,rec:.6},ai:{min:110,w:3}},
  {id:'s2',name:'Abalo Sísmico',icon:ic('ring',L.malrath),cd:11,desc:'Pancada no convés: anel de choque que atinge quem fugiu.',k:{kind:'ring',r0:160,r:280,dmg:100,wind:.8},ai:{max:260,w:3}},
  {id:'s3',name:'Vórtice Negro',icon:ic('vortex',L.malrath),cd:18,desc:'Puxa você para o centro e fere; no fim, uma pancada.',k:{kind:'pull',r:320,dur:2.4,force:150,dmg:24,tick:.45,slam:{r:130,dmg:120}},ai:{w:2.8}},
  {id:'s4',name:'Canhão do Capitão',icon:ic('beam',L.malrath),cd:14,desc:'Tiro enorme e lento, de grande dano. Na fúria, dispara duas vezes.',k:{kind:'beam',w:70,dmg:230,charge:1.5,track:2.5,dur:.45,shots2:1,charge2:.8},ai:{min:160,w:3}},
  {id:'s5',name:'Maré Negra',icon:ic('zone',L.malrath),cd:15,desc:'Poças de maré escura que ferem por vários segundos.',k:{kind:'zone',n:4,n2:2,r:80,dur:5,dmg:18,delay:.9,aim:'foes',kind2:'tide'},ai:{w:2.8}}],
 basic:{hits:3,hits2:1,dmgs:[34,38,50,76],knock:90},
 basics:basics(L.malrath,['Sabre do Capitão','Combo de 3 golpes (4 na fúria). O último empurra forte.'],[''],['Passo de Convés','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  init(R){R.mech.t=0;R.mech.pulse=0},
  tick(R,A,dt){const m=R.mech;
   if(m.pulse>0){m.pulse-=dt;for(const t of BossKit.foes(A)){const d=Math.hypot(A.x-t.x,A.y-t.y);if(d<300&&d>40){const n=Math.atan2(A.y-t.y,A.x-t.x),f=110*dt;move(t,Math.cos(n)*f,Math.sin(n)*f)}}
    if(m.pulse<=0){BossKit.shock(R,120,75,70,0,A.x,A.y,true)}return}
   if(R.act)return;m.t+=dt;
   if(m.t>=12){m.t=0;m.pulse=1.1;BossKit.addTele(R,{kind:'circle',follow:A,r:300,dur:1.1,color:col(R).a});toast('Pulso Gravitacional! Fuja ou esquive a pancada.')}},
  hud:R=>({text:R.mech.pulse>0?'GRAVIDADE · PANCADA!':'GRAVIDADE · pulso em '+Math.ceil(Math.max(0,12-R.mech.t))+'s',meter:R.mech.pulse>0?1:R.mech.t/12,color:'#d06aff'}),
  aura:R=>R.mech.pulse>0?1:0
 }};

/* ============================== 8 · HADRION — o deus do submundo (vilão do Cavaleiro do Firmamento) ============================== */
const hadrion={id:'hadrion',name:'Hadrion, Deus do Submundo',title:'Soberano das Almas Perdidas',look:L.hadrion,hp:3600,hpDuo:4600,stars:5,difficulty:'Extrema',speed:114,pref:200,
 story:'Cada guerreiro que cai na terra vai parar nas mãos de Hadrion. Ele coleciona as almas dos derrotados e as solta, famintas, contra os vivos.',
 system:['Colheita de Almas','Cada golpe que ele acerta prende uma alma que gira ao redor dele. Com 6 almas, todas disparam de uma vez contra você, perseguindo. Evite ser acertado para não alimentá-lo.'],systemIcon:ic('orbit',L.hadrion),
 tips:['Cada alma ao redor dele é um golpe que você levou: não deixe chegar a 6.','Quando as almas dispararem, use o DASH no último instante: elas perseguem.','O Portal Sombrio traz ele por trás de você.','O Julgamento dos Mortos pode ser interrompido com muito dano.'],
 skills:[
  {id:'s0',name:'Garra do Submundo',icon:ic('blast',L.hadrion),cd:5,desc:'Garras de sombra em volta dele.',k:{kind:'blast',r:130,dmg:90,wind:.5,knock:100},ai:{max:180,w:4}},
  {id:'s1',name:'Lamento',icon:ic('fan',L.hadrion),cd:7,desc:'Gritos de alma que perseguem de leve. Na fúria, mais gritos.',k:{kind:'fan',n:5,n2:2,spread:.9,speed:330,dmg:40,r:11,homing:1.8,wind:.5},ai:{min:110,w:3}},
  {id:'s2',name:'Correntes de Almas',icon:ic('mark',L.hadrion),cd:12,desc:'Prende quem ficar no círculo e dispara o Lamento em seguida.',k:{kind:'mark',r:78,delay:1,root:1.4,dmg:60,then:'s1',label:'ACORRENTADO'},ai:{w:2.4}},
  {id:'s3',name:'Portal Sombrio',icon:ic('blink',L.hadrion),cd:9,desc:'Surge atrás de você com um golpe. Na fúria, dá dois saltos.',k:{kind:'blink',wind:.4,dmg:105,r:85,hops:1,hops2:1},ai:{min:60,w:3}},
  {id:'s4',name:'Pilares de Chama Fria',icon:ic('rain',L.hadrion),cd:12,desc:'Marca pontos e derruba chamas frias em ondas, deixando gelo no chão.',k:{kind:'rain',waves:2,waves2:1,per:2,r:60,dmg:90,delay:1,leave:{dmg:12,dur:3,kind:'cold'}},ai:{w:2.6}},
  {id:'s5',name:'Julgamento dos Mortos',icon:ic('nova',L.hadrion),cd:28,desc:'Esfera de almas sobre uma área enorme. Interrompa com muito dano ou saia da área.',k:{kind:'nova',charge:3.2,r:320,dmg:330,interrupt:420,label:'Julgamento dos Mortos'},ai:{w:3.4}}],
 basic:{hits:3,hits2:1,dmgs:[30,34,44,66]},
 basics:basics(L.hadrion,['Toque Gélido','Combo de 3 golpes (4 na fúria). O último empurra.'],[''],['Passo Espectral','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  onLanded(R){R.wisps=R.wisps||[];if(R.wisps.length<6)R.wisps.push({a0:Math.random()*TAU,r:48+(R.wisps.length%2)*12,age:0,hold:9,launched:false,dmg:46,speed:300,homing:2.6});
   if(R.wisps.length>=6){for(const w of R.wisps)w.hold=w.age+.05;toast('As almas foram libertadas!')}},
  hud:R=>({text:'ALMAS '+((R.wisps||[]).length)+'/6',meter:((R.wisps||[]).length)/6,color:'#7affef'}),
  aura:R=>((R.wisps||[]).length)/7
 }};

/* ============================== 9 · GÊNESIS — o homúnculo primordial (vilão do Alquimista de Aço) ============================== */
const genesis={id:'genesis',name:'Gênesis, o Primordial',title:'Pai de Todos os Homúnculos',look:L.genesis,hp:3500,hpDuo:4500,stars:5,difficulty:'Extrema',speed:114,pref:200,
 story:'Nasceu de um frasco, sem rosto e sem nome, e prometeu ser tudo. Gênesis traça círculos de transmutação no chão: se ninguém os apagar, o mundo inteiro vira matéria-prima.',
 system:['Círculos de Transmutação','Periodicamente surgem círculos no chão (até 3). Ficar dentro de um por 1,3s o desfaz; se ninguém desfizer, ele explode em 7s causando dano alto. Divida-se para apagar todos.'],systemIcon:ic('system',L.genesis),
 tips:['Os círculos explodem em 7s. Vá até um e fique nele para desfazê-lo.','Divida as tarefas com o aliado: um apaga os círculos enquanto o outro ataca.','As Agulhas de Pedra deixam áreas que ferem: saia delas.','O Portal da Verdade pode ser interrompido com muito dano.'],
 skills:[
  {id:'s0',name:'Agulhas de Pedra',icon:ic('zone',L.genesis),cd:6,desc:'Marca o chão e ergue agulhas de pedra que ferem por alguns segundos.',k:{kind:'zone',n:4,n2:2,r:46,dur:3,dmg:22,delay:.7,aim:'foes',kind2:'stone'},ai:{w:3}},
  {id:'s1',name:'Palmas Alquímicas',icon:ic('blast',L.genesis),cd:5,desc:'Bate as mãos e libera uma onda de choque curta.',k:{kind:'blast',r:115,dmg:85,wind:.5,knock:100},ai:{max:170,w:4}},
  {id:'s2',name:'Quimera',icon:ic('clones',L.genesis),cd:13,desc:'Cria quimeras que correm até você e explodem.',k:{kind:'clones',n:2,n2:1,dmg:80,r:70,speed:170,life:5},ai:{w:2.6}},
  {id:'s3',name:'Prisma',icon:ic('beam',L.genesis),cd:9,desc:'Raio de luz que trava a mira. Na fúria, dispara duas vezes.',k:{kind:'beam',w:48,dmg:190,charge:1,track:4,dur:.4,shots2:1,charge2:.6},ai:{min:130,w:3}},
  {id:'s4',name:'Transmutar',icon:ic('ring',L.genesis),cd:12,desc:'Anel de choque que atinge também quem se afastou.',k:{kind:'ring',r0:170,r:280,dmg:100,wind:.8},ai:{max:260,w:3}},
  {id:'s5',name:'Portal da Verdade',icon:ic('nova',L.genesis),cd:30,desc:'Esfera enorme de matéria sobre uma área grande. Interrompa com muito dano.',k:{kind:'nova',charge:3.2,r:320,dmg:340,interrupt:430,label:'Portal da Verdade'},ai:{w:3.4}}],
 basic:{hits:3,hits2:1,dmgs:[30,34,44,66]},
 basics:basics(L.genesis,['Mão Alquímica','Combo de 3 golpes (4 na fúria). O último empurra.'],[''],['Passo Dourado','Dash curto do chefe, com invulnerabilidade, ao ver um golpe se formando.']),
 mech:{
  init(R){R.mech.runes=[];R.mech.t=6},
  tick(R,A,dt){const m=R.mech;m.t-=dt;
   if(m.t<=0&&m.runes.length<3&&!R.dying){m.t=R.phase===2?8:10;const ts=BossKit.foes(A);if(ts.length){const t=ts[Math.floor(Math.random()*ts.length)],o=Math.random()*TAU,d=90+Math.random()*120;
     m.runes.push({x:clamp(t.x+Math.cos(o)*d,80,W-80),y:clamp(t.y+Math.sin(o)*d*.7,80,H-80),t:0,prog:0,det:7,r:72});toast('Círculo de transmutação! Fique dentro dele para desfazê-lo.')}}
   for(const r of m.runes){r.t+=dt;let inside=false;for(const t of BossKit.foes(A))if(Math.hypot(t.x-r.x,t.y-r.y)<r.r+t.r*.4)inside=true;
    r.prog=inside?r.prog+dt:Math.max(0,r.prog-dt*.5);
    if(r.prog>=1.3){r.done=true;ring(r.x,r.y,r.r,'#fff',.5);spark(r.x,r.y,col(R).a,14);float(r.x,r.y-40,'DESFEITO','#fff2c0')}
    else if(r.t>=r.det){r.done=true;ring(r.x,r.y,110,'#fff',.7);ring(r.x,r.y,70,col(R).b,.6);spark(r.x,r.y,col(R).b,30);combatImpact(1.8);combatSound('crit',1.3);
     for(const t of BossKit.foes(A))if(Math.hypot(t.x-r.x,t.y-r.y)<110+t.r)BossKit.bossHit(R,t,120,100,Math.atan2(t.y-r.y,t.x-r.x),{breakGuard:true})}}
   m.runes=m.runes.filter(r=>!r.done)},
  drawWorld(R){const m=R.mech;for(const r of m.runes){const k=r.t/r.det,pulse=.5+.5*Math.sin(clock*(6+k*14));
    ctx.save();ctx.translate(r.x,r.y);
    ctx.globalAlpha=.25+.2*pulse;ctx.fillStyle=col(R).a;ctx.beginPath();ctx.arc(0,0,r.r,0,TAU);ctx.fill();
    ctx.globalAlpha=.9;ctx.strokeStyle=col(R).b;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r.r,0,TAU);ctx.stroke();
    ctx.rotate(clock*.8);ctx.strokeStyle=col(R).a;ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU;ctx.lineTo(Math.cos(a)*r.r*.8,Math.sin(a)*r.r*.8)}ctx.closePath();ctx.stroke();ctx.rotate(-clock*1.6);ctx.beginPath();for(let i=0;i<3;i++){const a=i/3*TAU;ctx.lineTo(Math.cos(a)*r.r*.55,Math.sin(a)*r.r*.55)}ctx.closePath();ctx.stroke();
    ctx.rotate(clock*.8);ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r.r+6,-Math.PI/2,-Math.PI/2+TAU*k);ctx.stroke();
    if(r.prog>0){ctx.strokeStyle='#8affb0';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r.r-6,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,r.prog/1.3));ctx.stroke()}
    ctx.restore()}},
  hud:R=>({text:'CÍRCULOS '+R.mech.runes.length+'/3',meter:R.mech.runes.length/3,color:'#ffd24a'}),
  aura:R=>R.mech.runes.length/4
 }};

for(const d of[vhalor,kuroen,nyxar,ryoku,xerath,rapina,malrath,hadrion,genesis]){
 HuntAPI.register(d);
}
// no JSON do "k.kind2" acima: o motor lê P.kind como tipo de ataque; a variante visual da zona fica em kind2
for(const d of HuntAPI.ROSTER)if(d.generic)for(const s of d.skills)if(s.k.kind==='zone'&&s.k.kind2){s.k={...s.k,vis:s.k.kind2}}
})();
