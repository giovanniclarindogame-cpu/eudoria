#!/usr/bin/env bash
# Gerencia os amigos que podem abrir o jogo. Rode na VPS, dentro de servidor/implantar. NÃO reinicia nada: vale na hora.
#   sudo bash amigos.sh add NOME [NOME2 NOME3 ...]   cria os acessos e MOSTRA cada senha uma única vez (guarde: rodar de novo com | tee APAGA o arquivo anterior; use tee -a)
#   sudo bash amigos.sh remover NOME                  corta o acesso desse amigo na hora
#   sudo bash amigos.sh verificar NOME SENHA          diz se a senha confere
#   sudo bash amigos.sh lista                         mostra os nomes com acesso
#   sudo bash amigos.sh quem                          mostra quem abriu o jogo (aberturas, último acesso, IPs)
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$DIR/acessos"; chmod 777 "$DIR/acessos" 2>/dev/null; touch "$DIR/acessos/usuarios.txt"; chmod 666 "$DIR/acessos/usuarios.txt" 2>/dev/null
case "${1:-}" in
  add|remover|lista|quem|verificar)
    # "docker exec" direto (o "docker compose exec" às vezes não termina de fechar a saída e trava o comando)
    CID="$(docker ps -q --filter "label=com.docker.compose.project.working_dir=$DIR" --filter "label=com.docker.compose.service=servidor" | head -1)"
    [ -n "$CID" ] || CID="$(docker ps -q --filter "name=servidor" | head -1)"
    if [ -z "$CID" ]; then echo "O servidor do jogo não está rodando. Veja:  cd $DIR && docker compose ps" >&2; exit 2; fi
    timeout -s KILL 60 docker exec "$CID" node amigos.cjs "$@"
    rc=$?
    if [ "$rc" -ne 0 ] && [ "$rc" -ne 1 ]; then
      echo "Não consegui falar com o servidor do jogo (código $rc). Ele pode estar atualizando: espere uns minutos e tente de novo." >&2
      echo "Veja:  tail -n 20 /var/log/eldoria-auto.log   e   cd $DIR && docker compose ps" >&2
    fi
    exit $rc ;;
  *) sed -n 2,8p "$0" ;;
esac
