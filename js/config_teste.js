'use strict';
/*
 * FASE DE TESTE COM AMIGOS (liga/desliga aqui). Com ativo = true:
 *  - semMoedas: sem moedas nem cristais na tela, sem Loja, sem recompensa em moedas (partidas, tutorial, missões);
 *  - semPresentes: sem presente inicial nem presente diário;
 *  - todosHerois: todos os campeões liberados (também online; o servidor aceita qualquer campeão: variável FASE_TESTE=0 no servidor volta ao normal);
 *  - tutorialObrigatorio: quem entra pela primeira vez faz o treino com o fantoche (e as dicas da 1ª luta) sem poder pular.
 * Para a versão final: troque "ativo" para false (ou use ?teste=0 para ver o jogo normal). Fica desligada com ?allheroes=1 (testes automáticos).
 */
window.ELDORIA_TESTE={ativo:!/[?&](allheroes=1|teste=0)/.test(location.search),semMoedas:true,semPresentes:true,todosHerois:true,tutorialObrigatorio:true};
/* CAÇADA DO DIA (liga/desliga aqui). false = o modo aparece como "Em breve" e não abre; a missão diária da Caçada também fica de fora.
 * Para liberar quando os chefes estiverem prontos: troque para true. Para testar antes de liberar, abra o jogo com ?cacada=1. */
window.CACADA_LIBERADA=false||/[?&]cacada=1/.test(location.search);
/* Chefe da Caçada do Dia: por enquanto é sempre este (id do chefe). Troque por null para voltar a rodar um chefe por dia. */
window.CACADA_CHEFE_FIXO='zorvath';
window.ELDORIA_TESTE_ON=k=>!!(window.ELDORIA_TESTE&&ELDORIA_TESTE.ativo&&ELDORIA_TESTE[k]);
