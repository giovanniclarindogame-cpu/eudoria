// P processos ao mesmo tempo, cada um com N partidas (um processo por núcleo)
const { spawn } = require('child_process');const P=+process.argv[2]||4,N=+process.argv[3]||10,S=+process.argv[4]||15;
let out=[];let done=0;
for(let i=0;i<P;i++){const c=spawn('node',['medir_partidas.cjs',String(N),String(S)],{cwd:__dirname,env:process.env});let b='';c.stdout.on('data',d=>b+=d);c.on('close',()=>{out.push(b.trim().split('\n').pop());if(++done===P){for(const l of out)console.log(l)}})}
