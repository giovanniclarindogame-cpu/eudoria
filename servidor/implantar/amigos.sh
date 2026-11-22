#!/usr/bin/env bash
# Gerencia as senhas dos amigos que podem abrir o jogo. Rode na VPS, dentro de servidor/implantar:
#   sudo bash amigos.sh add NOME [NOME2 NOME3 ...]   cria os acessos e MOSTRA cada senha uma única vez
#   sudo bash amigos.sh remover NOME                  corta o acesso desse amigo
#   sudo bash amigos.sh lista                         mostra os nomes com acesso
#   sudo bash amigos.sh quem                          mostra quem abriu o jogo ultimamente (log do Caddy)
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ARQ="$DIR/acessos/usuarios.txt"
mkdir -p "$DIR/acessos"; touch "$ARQ"; chmod 600 "$ARQ"
# nenhum passo pode travar: tudo com limite de tempo
recarregar() {
  # "caddy reload" trava nesta VPS; reiniciar o Caddy funciona (alguns segundos fora do ar). KILL: corta de verdade se travar.
  echo "Aplicando (reiniciando o Caddy, uns segundos)..." >&2
  (cd "$DIR" && timeout -s KILL 90 docker compose restart caddy >/dev/null 2>&1) || echo "  ATENÇÃO: não consegui reiniciar o Caddy. Rode:  cd $DIR && docker compose restart caddy" >&2
}
hash_senha() { timeout -s KILL 60 docker run --rm caddy:2 caddy hash-password --plaintext "$1" 2>/dev/null; }
novo=0
case "${1:-}" in
  add)
    shift; [ "$#" -ge 1 ] || { echo "Uso: bash amigos.sh add NOME [NOME2 ...]"; exit 1; }
    for N in "$@"; do
      [[ "$N" =~ ^[A-Za-z0-9_-]{2,30}$ ]] || { echo "Nome inválido '$N' (2 a 30 letras/números, sem espaço ou acento): pulei"; continue; }
      if grep -q "^$N " "$ARQ"; then echo "Já existe '$N': pulei. (Para trocar a senha: bash amigos.sh remover $N e depois add)"; continue; fi
      SENHA="$(head -c 9 /dev/urandom | od -An -tx1 | tr -d ' \n')"
      HASH="$(hash_senha "$SENHA")"
      [ -n "$HASH" ] || { echo "Não consegui gerar a senha de '$N' (o Docker respondeu a tempo?): pulei"; continue; }
      echo "$N $HASH" >> "$ARQ"; novo=$((novo+1))
      echo "usuário: $N"; echo "senha:   $SENHA"; echo
    done
    [ "$novo" -gt 0 ] && recarregar
    echo "Criados: $novo. Anote as senhas acima: não dá para ver de novo." >&2 ;;
  remover)
    N="${2:-}"; [ -n "$N" ] || { echo "Uso: bash amigos.sh remover NOME"; exit 1; }
    sed -i "/^$N /d" "$ARQ"; recarregar; echo "Acesso de $N removido." ;;
  lista) cut -d' ' -f1 "$ARQ" ;;
  quem)
    (cd "$DIR" && timeout -s KILL 30 docker compose exec -T caddy sh -c 'tail -n 20000 /data/acessos.log' 2>/dev/null) | node -e '
      let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m={};for(const l of s.split("\n")){try{const j=JSON.parse(l);const u=j.user_id;if(!u)continue;const x=m[u]=m[u]||{n:0,ult:0,ips:new Set()};x.n++;x.ult=Math.max(x.ult,j.ts);x.ips.add((j.request.headers["X-Forwarded-For"]||[j.request.remote_ip])[0].split(":")[0])}catch{}}
      for(const[u,x]of Object.entries(m))console.log(u.padEnd(14),String(x.n).padStart(6),"pedidos  último:",new Date(x.ult*1000).toLocaleString("pt-BR"),"  IPs:",[...x.ips].join(","))})' ;;
  *) sed -n 2,7p "$0" ;;
esac
