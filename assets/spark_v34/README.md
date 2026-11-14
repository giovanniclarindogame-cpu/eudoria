# Herdeiro da Centelha — corpo de combate v34

`body.webp`: atlas transparente WebP sem perdas de 1254 × 1254, com 36 células de 209 × 209. Proporções e acabamento seguem o primeiro campeão (`corpos_v24/astral-base.webp`): tronco largo, membros robustos e cabeça proporcional. Preserva cabelo verde com mecha clara, gola laranja, traje verde-escuro e botas.

Linhas: repouso, corrida lateral, corrida frontal, corrida de costas, socos, reações. A última linha contém reação, recuperação, queda, caído, defesa e esquiva. Altura máxima de repouso: 173 px; sola em y=193. `js/heir_v33.js` normaliza o repouso para 73 px na arena, com o mesmo apoio do primeiro campeão, e usa o canvas diretamente para preservar detalhes. As poses de dano usam apenas reação/recuperação; as poses de queda acompanham o nocaute.

Empacotamento dos PNGs gerados: `node scripts/pack-combat-body.cjs origem.png assets/spark_v34/body.webp`. O empacotador apenas recorta, escala uniformemente e posiciona as células; a anatomia vem da arte gerada.

Validação: com o jogo servido em `http://127.0.0.1:8000`, execute `node tests/combat-proportions-v34.cjs`. Compara repouso e apoio com o primeiro campeão, renderiza estados de combate nas duas orientações e captura a arena em desktop/celular.
