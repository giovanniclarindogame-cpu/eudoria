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
window.ELDORIA_TESTE_ON=k=>!!(window.ELDORIA_TESTE&&ELDORIA_TESTE.ativo&&ELDORIA_TESTE[k]);
