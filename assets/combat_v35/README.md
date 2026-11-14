# Corpos e habilidades — v35

Caçador e Herdeiro usam anatomia juvenil compacta, sem musculatura exagerada, com os cinco primeiros campeões como referência visual. Os quatro atlas têm 6 × 6 células de 209 px, transparência e apoio em y=193. A escala em combate é normalizada para 73 px em repouso.

- `hunter-body.webp` e `heir-body.webp`: repouso, corrida lateral/frontal/costas, ataques de reserva e reações/queda.
- `hunter-skills.webp`: linhas na ordem Soco Carregado, Pedra Rápida, Vara Giratória, Salto Selvagem, Instinto Animal, preparo do Juramento. A transformação adulta continua usando seu atlas específico.
- `heir-skills.webp`: linhas na ordem Impacto Esmeralda, Chute Relâmpago, Salto Ricochete, Estalo de Vento/dash, Corpo Energizado, Limite Rompido.

Cada técnica tem seis desenhos: dois de preparo, dois de execução e dois de recuperação. `js/poses_v35.js` sincroniza a fase com os tempos reais da habilidade. A carga mantém o preparo; golpes interrompidos mostram reação; saltos acompanham o deslocamento. O botão principal do Herdeiro (slot 1) usa a linha de chutes, com joelho recolhido e perna estendida.

Empacotamento: `node scripts/pack-combat-body.cjs origem.png destino.webp`. O código apenas recorta e posiciona os desenhos gerados, mantendo a anatomia.

Validação: `tests/skill-bodies-v35.cjs`, `tests/combat-proportions-v34.cjs`, `tests/heir-v33-integration.cjs` e `tests/hunter-v32-integration.cjs`. Os testes precisam do servidor local na porta 8000; a comparação visual das técnicas é gravada em `/tmp/skills-v35.png`.
