'use strict';
/* Visuais (looks) dos 9 chefes. Cada um é um vilão original que remete ao arquétipo de um vilão dos nossos heróis. */
const BOSS_LOOKS={
 // Ninja das Brumas → o mascarado das sombras
 vhalor:{id:'vhalor',skin:'#d6b494',skinS:'#a98466',
  hair:{type:'spiky',c:'#16131c',h:'#4a4658',h2:'#8a869a'},
  torso:{c:'#1d1b25',s:'#121018',h:'#363345',trim:'#d23a3a',trimS:'#8a1f1f',trimH:'#ff8a7a'},
  under:{c:'#2b2a38',s:'#1a1924',h:'#413f55'},boots:{c:'#17151e',trim:'#d23a3a'},
  glove:{c:'#26242f',s:'#17151e',h:'#d23a3a'},belt:'#d23a3a',
  cape:{a:'#8a1220',b:'#3a0a12',c:'#c43a3a'},mask:{type:'full',c:'#d9722a',mark:'#1a0a08'},
  eyes:{iris:'#ff2a2a'},extras:[],aura:{a:'#d23a3a',b:'#ffb0a0'}},
 // Ronin Carmesim → o espadachim incandescente
 kuroen:{id:'kuroen',skin:'#d9a47c',skinS:'#a97a58',
  hair:{type:'long',c:'#0f0f16',h:'#2a2a3a',h2:'#5a5a72'},
  torso:{c:'#e6dfc9',s:'#b9b09a',h:'#fff8e4',trim:'#6a1218',trimS:'#3a0a0e',trimH:'#c43a3a'},
  under:{c:'#1d1b2b',s:'#121120',h:'#34314a'},boots:{c:'#14121c',trim:'#6a1218'},
  glove:{c:'#e6dfc9',s:'#b9b09a',h:'#fff8e4'},sleeve:{c:'#6a1218',s:'#3a0a0e'},belt:'#c43a3a',
  cape:null,mask:null,eyes:{iris:'#ff6a2a'},extras:['scar'],
  weapon:{type:'katana',len:21,c:'#d0dce8',h:'#fff',glow:'#ff7a2a',guard:'#c9a64a'},aura:{a:'#ff7a2a',b:'#ffd27a'}},
 // Guardião Solar → o senhor do crepúsculo (índigo e âmbar)
 nyxar:{id:'nyxar',skin:'#d8cfe0',skinS:'#a89cbc',
  hair:{type:'long',c:'#c9cbe4',h:'#eef0ff',h2:'#fff'},
  torso:{c:'#1c1a3e',s:'#100e28',h:'#3a3670',trim:'#ff9a3a',trimS:'#b8601a',trimH:'#ffd9a0',gem:'#ffb24a'},
  under:{c:'#14122e',s:'#0a0820',h:'#2c2858'},boots:{c:'#100e28',trim:'#ff9a3a'},
  glove:{c:'#2a2660',s:'#1c1a3e',h:'#ff9a3a'},belt:'#ff9a3a',
  cape:{a:'#2e2470',b:'#120f32',c:'#ff9a3a'},capeLen:12,eyes:{c:'#fff',iris:'#ffb24a'},
  extras:['crown','spikes'],crownC:'#ff9a3a',crownGem:'#fff',
  weapon:{type:'staff',len:24,c:'#3a3670',tip:'#ffb24a',guard:'#ff9a3a'},aura:{a:'#ff9a3a',b:'#ffe0a8'}},
 // Lutador do Eclipse → o rei das maldições
 ryoku:{id:'ryoku',skin:'#e6b69c',skinS:'#b9806a',
  hair:{type:'spiky',c:'#ff8fb2',h:'#ffc2d4',h2:'#fff0f4'},
  torso:{c:'#f2eee8',s:'#c9c2b8',h:'#fff',trim:'#222230',trimS:'#12121c',trimH:'#555570'},
  under:{c:'#2a2a3a',s:'#1a1a28',h:'#44445a'},boots:{c:'#1a1a28',trim:'#d9d2c8'},
  glove:{c:'#e6b69c',s:'#b9806a',h:'#f3cfb8'},sleeve:{c:'#f2eee8',s:'#c9c2b8'},belt:'#222230',
  cape:null,eyes:{iris:'#ff2a3a'},extras:['tattoo'],aura:{a:'#d62a6a',b:'#ff9ac4'}},
 // Caçador Espectral → o rei quimera
 xerath:{id:'xerath',skin:'#c9ced4',skinS:'#8f98a4',
  hair:{type:'antenna',c:'#3a4250',h:'#9ae6b8'},
  torso:{c:'#3a424f',s:'#262c36',h:'#5a6678',trim:'#9ae6b8',trimS:'#4fae7a',trimH:'#e0fff0',gem:'#7aff9a'},
  under:{c:'#2a303a',s:'#1a1e26',h:'#465060'},boots:{c:'#20252e',trim:'#9ae6b8'},
  glove:{c:'#3a424f',s:'#262c36',h:'#9ae6b8'},belt:'#9ae6b8',
  cape:null,eyes:{c:'#eaffee',iris:'#2aff7a'},extras:['wings'],wing:{c:'#c8f4e0',s:'#7ac8a0'},aura:{a:'#3ad68a',b:'#c8ffe0'}},
 // Herdeiro da Centelha → o usurpador
 rapina:{id:'rapina',skin:'#c9b4a2',skinS:'#98806c',
  hair:{type:'bald',c:'#222',h:'#444'},
  torso:{c:'#1b2030',s:'#10131e',h:'#363f5a',trim:'#7a8ac0',trimS:'#4a5688',trimH:'#c8d2f4'},
  under:{c:'#171b28',s:'#0c0f18',h:'#2c3450'},boots:{c:'#10131e',trim:'#7a8ac0'},
  glove:{c:'#252b40',s:'#161a28',h:'#7a8ac0'},belt:'#7a8ac0',
  cape:{a:'#222a40',b:'#10131e',c:'#4a5688'},capeLen:13,mask:{type:'half',c:'#3a4156',mark:'#9aa6d0'},
  eyes:{c:'#fff',iris:'#cfe0ff'},extras:['scar'],aura:{a:'#6a7ae0',b:'#cfd8ff'}},
 // Corsário da Maré → o capitão devorador
 malrath:{id:'malrath',skin:'#b98b66',skinS:'#8a6244',
  hair:{type:'long',c:'#161014',h:'#2a2024',h2:'#4a3a40'},
  torso:{c:'#17151a',s:'#0e0c10',h:'#34303a',trim:'#c0303a',trimS:'#7a1a22',trimH:'#ff7a82'},
  under:{c:'#3a2a22',s:'#241812',h:'#54423a'},boots:{c:'#241812',trim:'#c9a64a'},
  glove:{c:'#2a2024',s:'#161014',h:'#c9a64a'},belt:'#c9a64a',
  cape:{a:'#241a20',b:'#100a0e',c:'#5a2a34'},capeLen:11,eyes:{iris:'#ffd24a'},
  extras:['beard','hat','spikes'],beardC:'#161014',hatC:'#17151a',hatTrim:'#c9a64a',
  weapon:{type:'sabre',len:17,c:'#b8c4d0',h:'#fff',guard:'#c9a64a'},aura:{a:'#6a2a8a',b:'#d06aff'}},
 // Cavaleiro do Firmamento → o deus do submundo (preto e chamas de alma)
 hadrion:{id:'hadrion',skin:'#dde8e8',skinS:'#a8bcbc',
  hair:{type:'long',c:'#0b0e14',h:'#1c2a34',h2:'#3a5a68'},
  torso:{c:'#10181f',s:'#080d12',h:'#26384a',trim:'#3ad6c8',trimS:'#1a8a82',trimH:'#b8fff6',gem:'#7affef'},
  under:{c:'#0c1218',s:'#06090d',h:'#1c2a36'},boots:{c:'#080d12',trim:'#3ad6c8'},
  glove:{c:'#1c2a36',s:'#10181f',h:'#3ad6c8'},belt:'#3ad6c8',
  cape:{a:'#16363c',b:'#08141a',c:'#3ad6c8'},capeLen:14,eyes:{c:'#e8fffc',iris:'#7affef'},
  extras:['crown','spikes'],crownC:'#6a7a86',crownGem:'#7affef',aura:{a:'#3ad6c8',b:'#b8fff6'}},
 // Alquimista de Aço → o homúnculo primordial
 genesis:{id:'genesis',skin:'#f0ece6',skinS:'#c4bcb2',
  hair:{type:'long',c:'#d8c27a',h:'#f2e2a2',h2:'#fff6d0'},
  torso:{c:'#1a1a1c',s:'#0e0e10',h:'#363640',trim:'#e6b94a',trimS:'#9a7a22',trimH:'#fff0b0'},
  under:{c:'#141416',s:'#0a0a0c',h:'#2a2a30'},boots:{c:'#0e0e10',trim:'#e6b94a'},
  glove:{c:'#e6b94a',s:'#9a7a22',h:'#fff0b0'},belt:'#e6b94a',
  cape:{a:'#222226',b:'#0e0e10',c:'#e6b94a'},capeLen:12,eyes:{c:'#ffeaea',iris:'#ff2a2a'},
  extras:['thirdEye','halo'],haloC:'#e6b94a',aura:{a:'#e6b94a',b:'#ff6a4a'}}
};
if(typeof window!=='undefined')window.BOSS_LOOKS=BOSS_LOOKS;
