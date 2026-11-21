#!/usr/bin/env bash
# Teste do atualizador automático com um "GitHub" e um "Docker" falsos (não precisa de Docker nem de internet).
set -uo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
FALHAS=0; ok() { if [ "$1" = 0 ]; then echo "ok  - $2"; else echo "FALHOU: $2"; FALHAS=$((FALHAS+1)); fi; }
git init -q --bare "$T/origem.git"; git init -q -b entrega-v3 "$T/obra"
mkdir -p "$T/obra/servidor/implantar" "$T/obra/js" "$T/obra/assets"
echo a > "$T/obra/index.html"; echo a > "$T/obra/js/a.js"; echo a > "$T/obra/assets/x.png"; echo a > "$T/obra/servidor/servidor.cjs"; echo a > "$T/obra/servidor/LEIA-ME.md"
cp "$AQUI/auto-atualizar.sh" "$T/obra/servidor/implantar/"; echo "services: {}" > "$T/obra/servidor/implantar/docker-compose.yml"
(cd "$T/obra" && git add -A && git commit -qm base && git remote add origin "$T/origem.git" && git push -q origin entrega-v3)
git clone -q -b entrega-v3 "$T/origem.git" "$T/prod"
export PROD="$T/prod" STUB="$T/stub" STATE_DIR="$T/estado" LOG="$T/auto.log" ESPERA_PASSO=0
mkdir -p "$STUB"
cat > "$T/docker" <<'DK'
#!/usr/bin/env bash
echo "$*" >> "$STUB/chamadas"
case "$*" in
 *"console.log(j.partidas)"*) cat "$STUB/partidas" 2>/dev/null || echo 0 ;;
 *"process.exit(r.ok"*) h=$(git -C "$PROD" rev-parse HEAD); if [ -f "$STUB/ruim" ] && [ "$h" = "$(cat "$STUB/ruim")" ]; then exit 1; fi; exit 0 ;;
esac
exit 0
DK
chmod +x "$T/docker"; export DOCKER="$T/docker"
rodar() { bash "$PROD/servidor/implantar/auto-atualizar.sh"; }
sobe() { grep -c " up " "$STUB/chamadas" 2>/dev/null || true; }
publicar() { (cd "$T/obra" && echo "$RANDOM" > "$1" && git add -A && git commit -qm "muda $1" && git push -q origin entrega-v3); }
cabeca() { git -C "$PROD" rev-parse HEAD; }

: > "$STUB/chamadas"
rodar; [ ! -s "$STUB/chamadas" ] && [ ! -s "$LOG" ]; ok $? "sem novidade: não faz nada (nem registra)"

publicar assets/x.png; publicar servidor/LEIA-ME.md; H0=$(cabeca); rodar
[ "$(cabeca)" != "$H0" ] && [ "$(sobe)" = 0 ]; ok $? "só imagem e documentação: atualiza os arquivos e NÃO reinicia o servidor"

publicar js/a.js; rodar
[ "$(sobe)" = 1 ] && grep -q "PRONTO" "$LOG"; ok $? "mudança em js/: reconstrói e reinicia, e registra PRONTO"

echo 3 > "$STUB/partidas"; publicar servidor/servidor.cjs; H1=$(cabeca); rodar
[ "$(cabeca)" = "$H1" ] && [ "$(sobe)" = 1 ] && grep -q "3 partida(s) em andamento" "$LOG" && [ -f "$STATE_DIR/pendente" ]; ok $? "com 3 partidas em andamento: adia (não mexe em nada) e anota que está pendente"

echo $(( $(date +%s) - 20000 )) > "$STATE_DIR/pendente"; rodar
[ "$(sobe)" = 2 ] && grep -q "atualizo mesmo assim" "$LOG" && [ ! -f "$STATE_DIR/pendente" ]; ok $? "esperou mais de 3 h pelas partidas: atualiza mesmo assim"

echo 0 > "$STUB/partidas"; publicar index.html; cabeca > "$STUB/ruim"; H2=$(cabeca); (cd "$T/obra" && true)
git -C "$PROD" fetch -q origin entrega-v3; NOVO=$(git -C "$PROD" rev-parse origin/entrega-v3); echo "$NOVO" > "$STUB/ruim"; ANT=$(cabeca); rodar
[ "$(cabeca)" = "$ANT" ] && grep -q "Voltando para" "$LOG" && grep -q "voltou para a versão anterior" "$LOG" && [ -f "$STATE_DIR/falhou_$NOVO" ]; ok $? "versão nova não fica saudável: volta para a anterior, reconstrói e marca o commit como ruim"
N=$(sobe); rodar; [ "$(sobe)" = "$N" ]; ok $? "o commit ruim não é tentado de novo a cada 5 minutos"

rm -f "$STUB/ruim"; publicar js/a.js; rodar
[ "$(sobe)" -gt "$N" ] && grep -q "PRONTO" "$LOG"; ok $? "um commit novo depois da falha é atualizado normalmente"

mv "$T/origem.git" "$T/sumiu.git"; rodar; RC=$?
[ "$RC" = 0 ] && grep -q "não consegui buscar o GitHub" "$LOG"; ok $? "sem acesso ao GitHub: registra e tenta de novo depois, sem erro"
mv "$T/sumiu.git" "$T/origem.git"

echo; if [ "$FALHAS" = 0 ]; then echo "TUDO CERTO"; else echo "$FALHAS falha(s)"; fi; exit "$FALHAS"
