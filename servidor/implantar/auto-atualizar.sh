#!/usr/bin/env bash
# Atualizador automático do servidor de partidas do Eldoria. Roda sozinho a cada poucos minutos (systemd timer, ver instalar-auto.sh).
#  - Busca o GitHub. Se não há novidade, não faz nada.
#  - Se as novidades NÃO mexem no que o servidor usa (imagens, textos, documentação), só atualiza os arquivos e não reinicia nada.
#  - Se mexem (servidor/, js/, index.html), espera NÃO haver partida em andamento e então reconstrói e reinicia o servidor.
#    (Se ficar mais de 3 h esperando, atualiza mesmo assim.)
#  - Se a versão nova não ficar saudável em até ~90 s, VOLTA para a versão anterior e não tenta de novo o mesmo commit.
# Registro: /var/log/eldoria-auto.log   (veja com: tail -n 40 /var/log/eldoria-auto.log)
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"                 # .../servidor/implantar
REPO="$(cd "$DIR/../.." && pwd)"
DOCKER="${DOCKER:-docker}"
LOG="${LOG:-/var/log/eldoria-auto.log}"
STATE="${STATE_DIR:-/var/lib/eldoria-auto}"
LIMITE_ESPERA="${LIMITE_ESPERA:-10800}"              # segundos esperando as partidas acabarem (3 h)

log() { echo "$(date '+%F %T') $*" >> "$LOG"; }

partidas_ativas() {                                   # número de partidas em andamento (0 se o servidor estiver fora do ar: nada a proteger)
  local o
  o=$("$DOCKER" compose -f "$DIR/docker-compose.yml" exec -T servidor node -e "fetch('http://localhost:8787/saude').then(r=>r.json()).then(j=>console.log(j.partidas))" 2>/dev/null) || { echo 0; return; }
  o=$(echo "$o" | tr -dc '0-9'); echo "${o:-0}"
}
saudavel() {
  "$DOCKER" compose -f "$DIR/docker-compose.yml" exec -T servidor node -e "fetch('http://localhost:8787/saude').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1
}
subir() { (cd "$DIR" && "$DOCKER" compose up -d --build >> "$LOG" 2>&1); }

main() {
  mkdir -p "$STATE" "$(dirname "$LOG")" 2>/dev/null || true
  exec 9>"$STATE/trava"; flock -n 9 || exit 0         # só uma execução por vez
  cd "$REPO" || exit 1
  local ramo="${RAMO:-$(git rev-parse --abbrev-ref HEAD)}"
  git fetch -q origin "$ramo" 2>>"$LOG" || { log "não consegui buscar o GitHub (sem internet?): tento de novo depois"; exit 0; }
  local local_ remoto
  local_=$(git rev-parse HEAD); remoto=$(git rev-parse "origin/$ramo")
  if [ "$local_" = "$remoto" ]; then rm -f "$STATE/pendente"; exit 0; fi
  [ -f "$STATE/falhou_$remoto" ] && exit 0            # esse commit já falhou: espera um novo

  local mudou relevante
  mudou=$(git diff --name-only "$local_" "$remoto")
  relevante=$(echo "$mudou" | grep -E '^(servidor/|js/|index\.html$)' | grep -Ev '^(js/lib/|servidor/.*\.md$)' || true)

  if [ -z "$relevante" ]; then
    git reset -q --hard "$remoto"
    log "novidades que não mexem no servidor ($(echo "$mudou" | grep -c .) arquivos, ex.: imagens/textos): só atualizei os arquivos, sem reiniciar"
    rm -f "$STATE/pendente"; exit 0
  fi

  local n; n=$(partidas_ativas)
  if [ "$n" != "0" ]; then
    [ -f "$STATE/pendente" ] || date +%s > "$STATE/pendente"
    local espera=$(( $(date +%s) - $(cat "$STATE/pendente") ))
    if [ "$espera" -lt "$LIMITE_ESPERA" ]; then
      log "há mudança para o servidor, mas $n partida(s) em andamento: espero (há ${espera}s)"; exit 0
    fi
    log "esperei ${espera}s pelas partidas: atualizo mesmo assim"
  fi

  log "atualizando o servidor: $(git log --oneline -1 "$remoto") | arquivos que importam: $(echo "$relevante" | grep -c .)"
  git reset -q --hard "$remoto"
  subir
  local ok=0 i
  for i in $(seq 1 30); do if saudavel; then ok=1; break; fi; sleep "${ESPERA_PASSO:-3}"; done
  if [ "$ok" = 1 ]; then
    rm -f "$STATE/pendente"; "$DOCKER" image prune -f >/dev/null 2>&1 || true
    log "PRONTO: servidor no ar na versão $(git rev-parse --short HEAD)"; exit 0
  fi
  log "ERRO: a versão nova não ficou saudável. Voltando para $(git rev-parse --short "$local_")"
  touch "$STATE/falhou_$remoto"
  git reset -q --hard "$local_"; subir
  if saudavel; then log "voltou para a versão anterior e está no ar"; else log "ATENÇÃO: mesmo a versão anterior não subiu. Veja: cd $DIR && docker compose logs --tail 50"; fi
  exit 1
}
main "$@"; exit $?      # (a função inteira é lida antes de rodar: o git reset pode trocar este arquivo no meio sem quebrar a execução)
