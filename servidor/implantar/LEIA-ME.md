# Colocar o servidor de partidas no ar (Hostinger VPS)

Tempo: cerca de 30 minutos na primeira vez. Você só copia e cola. **Nunca mande a senha da máquina nem tokens no chat.**

## 1. Contratar o VPS
- Contrate um **VPS** (servidor virtual, "KVM"), **não** hospedagem compartilhada (ela não roda este tipo de servidor).
- **Local do servidor: Brasil (São Paulo)**, se estiver disponível, para o atraso ficar baixo. Se não houver, escolha o mais perto.
- **Sistema: Ubuntu 22.04 ou 24.04** (pode ser o modelo "Ubuntu com Docker", se existir; o instalador cuida do resto).
- **Tamanho:** cada partida usa uns 100 MB de memória e pouco processador.
  | Memória | Partidas ao mesmo tempo | Jogadores |
  |---|---|---|
  | 2 GB (só testes com amigos) | ~10 | ~20 |
  | 4 GB | ~30 | ~60 |
  | 8 GB | ~70 | ~140 |
  Para testes com amigos, **2 GB bastam** (o instalador cria 2 GB de swap sozinho nesse caso). Para abrir ao público, **4 GB e 2 vCPU** ou mais; dá para aumentar depois no painel. Confira os preços de **contratação e de renovação** antes de pagar.

## 2. Domínio (nome do servidor)
O jogo no celular só aceita conexão segura (`wss://`), e isso exige um nome (domínio) apontando para o IP do VPS. Escolha um:
- **A. Domínio próprio** (a Hostinger vende): crie um subdomínio, por exemplo `partidas.seudominio.com`.
- **B. Subdomínio grátis do DuckDNS** (duckdns.org): crie um nome como `eldoria.duckdns.org` e aponte para o IP do VPS. Bom para testar.
- **C. Só para um teste rápido:** `IP-com-hifens.sslip.io` (IP 203.0.113.7 vira `203-0-113-7.sslip.io`) já aponta sozinho para o IP, sem cadastro.
Em A, crie no painel de DNS um registro **tipo A**: nome = `partidas`, valor = **IP do VPS**. Pode levar de minutos a algumas horas para valer.

## 3. Abrir o terminal do VPS
No painel da Hostinger, abra o seu VPS e procure o **terminal no navegador** (ou o acesso SSH, que mostra o IP e o usuário `root`).
Se o painel tiver **firewall**, deixe abertas as portas **22, 80 e 443**.

## 4. Instalar (copie e cole, uma linha por vez)
```bash
apt-get update && apt-get install -y git
git clone --branch entrega-v3 https://github.com/giovanniclarindogame-cpu/eudoria.git /opt/eldoria
bash /opt/eldoria/servidor/implantar/instalar.sh SEU.DOMINIO.AQUI
```
O instalador: confere se o domínio aponta para a máquina, instala o Docker, liga o firewall (só SSH, 80 e 443), liga as atualizações de
segurança automáticas, ajusta o limite de partidas pela memória e sobe o servidor com o certificado HTTPS automático.
No fim aparece **PRONTO** e o endereço `wss://...`.

Se o repositório for privado, o `git clone` pede usuário e senha: use um token de acesso do GitHub como senha (me avise que eu explico).

## 5. Conferir
Abra no navegador `https://SEU.DOMINIO.AQUI/saude`: deve aparecer um texto com `"ok":true`.

## 6. Ligar o jogo ao servidor
Me diga o endereço (`wss://SEU.DOMINIO.AQUI`). Eu coloco em `js/config_servidor.js`, publico e testo. O botão **Partida rápida** passa a aparecer.
(Para testar sem publicar, abra o jogo com `?servidor=wss://SEU.DOMINIO.AQUI`.)

## Atualização automática (recomendado)
Em vez de rodar `atualizar.sh` à mão, ligue o atualizador automático. Ele confere o GitHub a cada 5 minutos:
- **sem novidade** → não faz nada;
- **novidade que não mexe no servidor** (imagens, textos, documentação) → só atualiza os arquivos, **sem reiniciar**;
- **mudança em `servidor/`, `js/` ou `index.html`** → espera **não haver partida em andamento**, reconstrói e reinicia (se ficar 3 h esperando, atualiza mesmo assim);
- se a versão nova **não ficar saudável** em ~90 s → **volta para a anterior** sozinho e não tenta o mesmo commit de novo.

Ligar (uma vez, no terminal do VPS):
```bash
bash /opt/eldoria/servidor/implantar/atualizar.sh          # traz estes scripts novos (e a versão atual)
sudo bash /opt/eldoria/servidor/implantar/instalar-auto.sh
```
Ver o que ele fez: `tail -n 40 /var/log/eldoria-auto.log`. Quando roda de novo: `systemctl list-timers eldoria-auto.timer`.
Desligar: `sudo bash /opt/eldoria/servidor/implantar/instalar-auto.sh desligar`.
Se o repositório for privado, o atualizador não consegue buscar o GitHub (aparece no registro): use um token (me avise).
O teste dele (com GitHub e Docker falsos): `bash servidor/implantar/testar-auto.sh`.

## Dia a dia
```bash
cd /opt/eldoria/servidor/implantar
bash atualizar.sh                   # baixa a versão nova e reinicia (depois de cada mudança no jogo/servidor)
docker compose logs --tail 100      # o que o servidor está dizendo
docker compose ps                   # está de pé?
curl -s https://SEU.DOMINIO.AQUI/saude    # jogadores, fila, partidas, saúde dos ticks
```
- **Mudou as regras da luta ou o protocolo?** Aumente `ELDORIA_BUILD` em `js/config_servidor.js` e `BUILD_MINIMO` no arquivo `.env` desta pasta, depois `bash atualizar.sh`.
- **Cuidados:** cada reinício do servidor derruba as partidas em andamento; atualize quando houver pouca gente. Faça um **snapshot/backup** pelo painel
  antes de mexer. Use **chave SSH** em vez de senha quando puder.

## Se algo der errado
| Sintoma | O que fazer |
|---|---|
| O instalador diz que o domínio não aponta para a máquina | Confira o registro A e espere propagar; ou `FORCAR=1 sudo -E bash instalar.sh DOMINIO` |
| `/saude` não abre / certificado com erro | `docker compose logs caddy --tail 50`. Quase sempre é o DNS ainda não valendo ou as portas 80/443 fechadas no firewall do painel |
| Jogo diz "Servidor indisponível" | Confira o endereço em `js/config_servidor.js` (`wss://`, sem barra no fim) e `/saude` |
| Memória no limite | Suba o plano no painel ou reduza `MAX_PARTIDAS` no `.env` e rode `docker compose up -d` |

## Jogo protegido por login (um acesso por amigo)

O jogo abre em `https://SEU-DOMINIO/` e pede **usuário e senha numa página de login** (cookie de 30 dias: a pessoa entra uma vez só).
Não usa a janela de senha do navegador, que em alguns celulares aparecia de novo no meio da partida.
O servidor de partidas, a conta e o feedback continuam abertos (o jogo precisa deles). Quem faz o login e entrega os arquivos é o próprio
servidor do jogo (`servidor/portao.cjs`); o Caddy só cuida do HTTPS.

```bash
cd /opt/eldoria/servidor/implantar
sudo bash amigos.sh add joao maria pedro   # cria os acessos e mostra cada senha UMA vez (não reinicia nada)
sudo bash amigos.sh remover joao           # corta o acesso na hora (o cookie dele deixa de valer)
sudo bash amigos.sh lista                  # quem tem acesso
sudo bash amigos.sh quem                   # quem abriu o jogo: aberturas, último acesso e IPs
```

As senhas ficam em `acessos/usuarios.txt` (só o hash, fora do GitHub). Sem nenhum amigo cadastrado ninguém entra.
O portão só entrega `index.html`, `css/`, `js/` e `assets/` (nunca `servidor/`, `tests/`, `scripts/`, `.git`). Senha errada 8 vezes = bloqueio de 10 min.
Se o `amigos.sh` disser que não consegue falar com o servidor, ele está atualizando: espere uns minutos.

### Repositório privado (depois que tudo acima estiver funcionando)
A VPS precisa de uma *deploy key* só de leitura, senão o atualizador deixa de buscar o GitHub:
1. Na VPS: `ssh-keygen -t ed25519 -f ~/.ssh/eldoria_deploy -N ""` e `cat ~/.ssh/eldoria_deploy.pub`
2. GitHub → repositório → Settings → Deploy keys → Add (NÃO marque "write").
3. Na VPS: `cd /opt/eldoria && git remote set-url origin git@github.com:giovanniclarindogame-cpu/eudoria.git` e
   `git config core.sshCommand "ssh -i ~/.ssh/eldoria_deploy -o IdentitiesOnly=yes"`; teste com `git fetch origin`.
4. Só então: GitHub → Settings → Danger Zone → Change visibility → Private.
Atenção: privado desliga o site do GitHub Pages (github.io); os amigos passam a usar o endereço da VPS.


## Modo manutenção (pausar o jogo sem mexer na VPS)
O arquivo `manutencao.json` (na raiz do repositório) controla tudo:
```json
{ "ativo": true, "titulo": "EM MANUTENÇÃO", "mensagem": "Estamos atualizando o Boss.", "volta": "18h30" }
```
- **`"ativo": true`** → quem abre o jogo vê só a tela de manutenção (o jogo nem carrega) e ela se atualiza sozinha quando acabar; o servidor
  recusa partidas novas (fila, convites, revanche) com aviso, mas deixa terminar as que estão rolando e aceita reconexão a elas.
- **`"ativo": false`** → tudo normal. `volta` é opcional (texto livre). Arquivo ausente ou quebrado = manutenção desligada.
- Como mudar: edite o arquivo no GitHub (pelo site ou app) na branch `entrega-v3`. A página (GitHub Pages) atualiza em 1–2 min; o servidor
  na VPS lê o arquivo na pasta do jogo (`/site`) assim que o atualizador automático (ou `bash atualizar.sh`) o trouxer, sem reiniciar.
- Para testar sem sair da manutenção: abra o jogo com `?semmanut=1`. `/saude` mostra `"manutencao": true/false`.
