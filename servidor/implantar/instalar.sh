#!/usr/bin/env bash
# Instala o servidor de partidas do Eldoria numa máquina Ubuntu/Debian nova.
# Uso:  sudo bash instalar.sh seu.dominio.com
set -euo pipefail

DOMINIO="${1:-}"
[ -n "$DOMINIO" ] || { echo "Uso: sudo bash instalar.sh seu.dominio.com"; exit 1; }
[ "$(id -u)" -eq 0 ] || { echo "Rode como administrador:  sudo bash instalar.sh $DOMINIO"; exit 1; }
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> 1/6  Conferindo o domínio ($DOMINIO)"
IP_MAQUINA="$(curl -4 -fsS https://ifconfig.me 2>/dev/null || true)"
IP_DOMINIO="$(getent ahostsv4 "$DOMINIO" 2>/dev/null | awk 'NR==1{print $1}' || true)"
if [ -z "$IP_DOMINIO" ] || { [ -n "$IP_MAQUINA" ] && [ "$IP_DOMINIO" != "$IP_MAQUINA" ]; }; then
  echo "AVISO: o domínio aponta para '${IP_DOMINIO:-nada}' e esta máquina é '${IP_MAQUINA:-desconhecido}'."
  echo "       Crie (ou espere propagar) um registro DNS tipo A:  $DOMINIO  ->  ${IP_MAQUINA:-IP desta máquina}"
  echo "       Sem isso o certificado HTTPS falha. Para continuar mesmo assim:  FORCAR=1 sudo -E bash instalar.sh $DOMINIO"
  [ "${FORCAR:-0}" = "1" ] || exit 1
fi

echo "==> 2/6  Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || { apt-get update -y && apt-get install -y docker-compose-plugin; }

echo "==> 3/6  Firewall (só SSH, HTTP e HTTPS)"
if command -v ufw >/dev/null 2>&1 || apt-get install -y ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null || ufw allow 22/tcp >/dev/null
  ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw allow 443/udp >/dev/null
  ufw --force enable >/dev/null
fi

echo "==> 4/6  Atualizações de segurança automáticas"
apt-get install -y unattended-upgrades >/dev/null 2>&1 || echo "(não consegui instalar as atualizações automáticas; faça 'apt update && apt upgrade' de vez em quando)"

echo "==> 5/6  Configuração (.env)"
RAM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
MAX=$(( (RAM_MB - 900) / 100 )); [ "$MAX" -lt 4 ] && MAX=4
AQUECIDAS=2; [ "$RAM_MB" -lt 3000 ] && AQUECIDAS=1
# pouca memória: cria 2 GB de troca (swap) para a instalação e os picos não derrubarem o servidor
if [ "$RAM_MB" -lt 3500 ] && [ -z "$(swapon --show --noheadings 2>/dev/null)" ]; then
  echo "Pouca memória (${RAM_MB} MB): criando 2 GB de swap"
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
if [ -f "$DIR/.env" ]; then
  echo "Já existe um .env: mantido. (Apague-o se quiser que eu gere de novo.)"
else
  cat > "$DIR/.env" <<ENV
DOMINIO=$DOMINIO
# partidas ao mesmo tempo: cerca de 100 MB de memória cada (esta máquina tem ${RAM_MB} MB)
MAX_PARTIDAS=$MAX
AQUECIDAS=$AQUECIDAS
# versão mínima do jogo instalado aceita (suba quando mudar as regras da luta)
BUILD_MINIMO=1
# deixe vazio para aceitar qualquer origem
ORIGENS=
ENV
fi

echo "==> 6/6  Subindo o servidor (a primeira vez demora alguns minutos)"
cd "$DIR"
mkdir -p acessos; chmod 777 acessos; [ -f acessos/usuarios.txt ] || { : > acessos/usuarios.txt; chmod 666 acessos/usuarios.txt; }
docker compose up -d --build

echo "Esperando o servidor responder..."
for i in $(seq 1 60); do
  if curl -fsS "https://$DOMINIO/saude" >/dev/null 2>&1; then
    echo
    echo "PRONTO! Servidor no ar:  https://$DOMINIO/saude"
    echo "Endereço para o jogo (js/config_servidor.js):  wss://$DOMINIO"
    exit 0
  fi
  sleep 3
done
echo
echo "O servidor subiu, mas https://$DOMINIO/saude ainda não respondeu (o certificado pode estar demorando)."
echo "Veja o que está acontecendo:  cd $DIR && docker compose logs --tail 50"
exit 1
