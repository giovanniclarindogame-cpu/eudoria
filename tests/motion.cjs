const assert=require('node:assert/strict');
const motion=require('../js/animacoes_campeoes.js');
for(let skin=6;skin<=9;skin++){
 const a={skin,x:100,y:100,a:0,moving:false};
 assert.equal(motion.sample(a).state,'idle');
 a.guard=true;assert.equal(motion.sample(a).frame,34);a.guard=false;
 a.hitReact=.3;assert.equal(motion.sample(a).frame,30);a.hitReact=.001;assert.equal(motion.sample(a).frame,35);a.hitReact=0;assert.equal(motion.sample(a).state,'idle');
 // Move up while aiming right; locomotion follows displacement, not the aim.
 motion.track(a,{x:100,y:120});assert.equal(motion.sample(a).frame>=18,true);assert.equal(motion.sample(a).frame<24,true);
 const stride=a.dojoMotion.stride;motion.track(a,{x:100,y:100});assert.equal(a.moving,false);assert.equal(a.dojoMotion.stride,stride);
 a.punchTime=.12;assert.equal(motion.sample(a).state,'punch');a.punchTime=0;
 a.dojo4Cast={angle:Math.PI,age:.5,skill:{type:'bolt',release:.5,duration:1}};
 assert.equal(motion.sample(a).frame,10);assert.equal(motion.sample(a).facing,-1);
 for(let age=0;age<=1;age+=.01){a.dojo4Cast.age=age;const m=motion.sample(a);assert.ok(m.frame>=0&&m.frame<24);}
 a.dojo4Cast=null;assert.equal(motion.sample(a).state,'idle');
}
console.log('PASS: four champions, guard, hurt recovery, movement direction, blocked movement, punch and cast phase boundaries');
