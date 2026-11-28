# Fantoche do treino em 3D (teste)
- `fantoche.glb`: modelo gerado no Tripo (sem esqueleto).
- `render_blender.py`: monta o esqueleto, aplica as poses de `poses.json` e renderiza cada quadro (vista do jogo, fundo transparente).
  Rodar: `pip install bpy` e depois `python3 render_blender.py -- '{"res":256,"amostras":40,"az":-18,"el":18,"zoom":1.08,"sol":6,"ceu":1.6}'`
  (os caminhos de entrada/saída estão em /tmp/claude-0/fant3d dentro do script).
- Resultado: `assets/arena_v15/fantoche3d.webp` (mesma grade da folha 2D: 6 colunas x 4 linhas de 128 px; linhas = parado, defesa, golpe, soco).
- No jogo: abrir com `?fantoche3d=1` para ver a versão 3D no Treino; sem isso continua a arte 2D.
