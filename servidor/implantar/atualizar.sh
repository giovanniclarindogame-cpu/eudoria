#!/usr/bin/env bash
# Baixa a versão nova do jogo/servidor e reinicia. Uso:  sudo bash atualizar.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
git -C "$DIR" pull --ff-only
mkdir -p acessos; chmod 777 acessos; [ -f acessos/usuarios.txt ] || { : > acessos/usuarios.txt; chmod 666 acessos/usuarios.txt; }
docker compose up -d --build
docker image prune -f >/dev/null
echo "Atualizado. Estado:"
sleep 5
curl -fsS "http://localhost:8787/saude" 2>/dev/null || docker compose exec -T servidor node -e "fetch('http://localhost:8787/saude').then(r=>r.text()).then(console.log)"
