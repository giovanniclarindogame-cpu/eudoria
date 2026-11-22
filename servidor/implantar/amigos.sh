#!/usr/bin/env bash
# Gerencia as senhas dos amigos que podem abrir o jogo. Rode na VPS, dentro de servidor/implantar:
#   sudo bash amigos.sh add NOME      cria o acesso e MOSTRA a senha uma única vez (manda para o amigo)
#   sudo bash amigos.sh remover NOME  corta o acesso desse amigo
#   sudo bash amigos.sh lista         mostra os nomes com acesso
#   sudo bash amigos.sh quem          mostra quem abriu o jogo ultimamente (log do Caddy)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ARQ="$DIR/acessos/usuarios.txt"
mkdir -p "$DIR/acessos"; touch "$ARQ"; chmod 600 "$ARQ"
recarregar() { (cd "$DIR" && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1) || (cd "$DIR" && docker compose up -d caddy >/dev/null); }
case "${1:-}" in
  add)
    N="${2:-}"; [[ "$N" =~ ^[A-Za-z0-9_-]{2,30}$ ]] || { echo "Nome: 2 a 30 letras/números (sem espaço ou acento). Ex.: joao"; exit 1; }
    grep -q "^$N " "$ARQ" && { echo "Já existe '$N'. Remova antes: bash amigos.sh remover $N"; exit 1; }
    SENHA="$(tr -dc 'a-hjkmnp-zA-HJ-NP-Z2-9' </dev/urandom | head -c 12)"
    HASH="$(cd "$DIR" && docker run --rm caddy:2 caddy hash-password --plaintext "$SENHA")"
    echo "$N $HASH" >> "$ARQ"; recarregar
    echo "Acesso criado para $N"; echo "  usuário: $N"; echo "  senha:   $SENHA   (anote agora: não dá para ver de novo)" ;;
  remover)
    N="${2:-}"; [ -n "$N" ] || { echo "Uso: bash amigos.sh remover NOME"; exit 1; }
    sed -i "/^$N /d" "$ARQ"; recarregar; echo "Acesso de $N removido." ;;
  lista) cut -d' ' -f1 "$ARQ" ;;
  quem)
    (cd "$DIR" && docker compose exec -T caddy sh -c 'tail -n 20000 /data/acessos.log' 2>/dev/null) | node -e '
      let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m={};for(const l of s.split("\n")){try{const j=JSON.parse(l);const u=j.user_id;if(!u)continue;const x=m[u]=m[u]||{n:0,ult:0,ips:new Set()};x.n++;x.ult=Math.max(x.ult,j.ts);x.ips.add((j.request.headers["X-Forwarded-For"]||[j.request.remote_ip])[0].split(":")[0])}catch{}}
      for(const[u,x]of Object.entries(m))console.log(u.padEnd(14),String(x.n).padStart(6),"pedidos  último:",new Date(x.ult*1000).toLocaleString("pt-BR"),"  IPs:",[...x.ips].join(","))})' ;;
  *) sed -n 2,7p "$0" ;;
esac
