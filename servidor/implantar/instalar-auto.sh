#!/usr/bin/env bash
# Liga a atualização automática do servidor: um temporizador do sistema (systemd) roda auto-atualizar.sh a cada 5 minutos.
# Uso:  sudo bash instalar-auto.sh        (para desligar:  sudo bash instalar-auto.sh desligar)
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Rode como administrador:  sudo bash instalar-auto.sh"; exit 1; }
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ "${1:-}" = "desligar" ]; then
  systemctl disable --now eldoria-auto.timer 2>/dev/null || true
  rm -f /etc/systemd/system/eldoria-auto.service /etc/systemd/system/eldoria-auto.timer; systemctl daemon-reload
  echo "Atualização automática DESLIGADA."; exit 0
fi
command -v systemctl >/dev/null || { echo "Este sistema não tem systemd. Use o cron:  */5 * * * * bash $DIR/auto-atualizar.sh"; exit 1; }
chmod +x "$DIR/auto-atualizar.sh"
cat > /etc/systemd/system/eldoria-auto.service <<UNIT
[Unit]
Description=Atualizador automático do servidor de partidas do Eldoria
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/bash $DIR/auto-atualizar.sh
TimeoutStartSec=900
UNIT
cat > /etc/systemd/system/eldoria-auto.timer <<'UNIT'
[Unit]
Description=Confere novidades do Eldoria a cada 5 minutos

[Timer]
OnBootSec=3min
OnUnitActiveSec=5min
Persistent=true

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now eldoria-auto.timer
systemctl start eldoria-auto.service || true     # confere já, agora
echo
echo "Atualização automática LIGADA (confere a cada 5 minutos)."
echo "Ver o que ela fez:   tail -n 40 /var/log/eldoria-auto.log"
echo "Quando roda a próxima: systemctl list-timers eldoria-auto.timer"
echo "Desligar:            sudo bash $DIR/instalar-auto.sh desligar"
