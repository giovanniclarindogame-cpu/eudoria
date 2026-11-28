# Fantoche do treino 3D (com rig e animações do Tripo)
- `boneco_treino_rig.glb`: modelo do Tripo com esqueleto Mixamo (65 ossos) e uma única ação de 600 quadros:
  parado 1–125 · andar 130–300 · levar golpe 300–335 · defesa 335–405 · soco 405–445 · morte 485–560.
- `render_blender.py` + `final.json`: renderiza a folha do jogo (linhas parado, defesa, golpe, soco). Defesa e golpe recebem um reforço
  de rotação (em `extra`) porque no Tripo eles quase não se mexem. Rodar: `pip install bpy` e
  `python3 render_blender.py -- "$(python3 -c 'import json;d=json.load(open("final.json"));d.update(hx=0,hy=0,amostras=40,res=256,sol=4.2,ceu=1.1);print(json.dumps(d))')"`
  (caminhos de /tmp/claude-0/fant3d2 dentro do script).
- Resultado: `assets/arena_v15/fantoche3d.webp`; no jogo só com `?fantoche3d=1`.
