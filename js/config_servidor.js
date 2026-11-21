// Endereço do servidor de partidas (WebSocket). Vazio = o botão "Partida rápida" fica escondido.
// Exemplo quando o servidor estiver no ar:  window.ELDORIA_SERVIDOR='wss://partidas.seudominio.com';
// Para testar localmente sem editar o arquivo, abra o jogo com ?servidor=ws://localhost:8787
window.ELDORIA_SERVIDOR='';
// Versão do jogo instalado. Aumente este número a cada versão que muda as regras da luta ou o protocolo; o servidor (BUILD_MINIMO)
// recusa quem estiver com versão mais antiga e mostra "atualize o jogo".
window.ELDORIA_BUILD=1;
