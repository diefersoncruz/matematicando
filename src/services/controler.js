import { gerarOperacao, zerarPontuacao, loadConfig, getConfig } from "./game.js";
import { configService } from "./configService.js";

let intervalo;
let tempoRestante;

// Função para formatar o tempo para exibição
function formatarTempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  return `${minutos.toString().padStart(2, "0")}:${segundosRestantes
    .toString()
    .padStart(2, "0")}`;
}

async function iniciarJogo(atualizarDados, salaId = null) {
  console.log('iniciarJogo chamado com salaId:', salaId);
  if (confirm("Pronto para começar?")) {
    // Load configuration from Supabase if salaId is provided
    if (salaId) {
      console.log('Carregando configurações da sala:', salaId);
      await loadConfig(salaId);
    }
    
    const configuracoes = getConfig();
    console.log('Configurações obtidas após loadConfig:', configuracoes);
    tempoRestante = configuracoes.limiteTempo;
    console.log('Tempo limite configurado:', tempoRestante);
    atualizarDados("jogoEmAndamento", true);
    atualizarDados("tempoFormatado", formatarTempo(tempoRestante));

    gerarOperacao(atualizarDados);
    zerarPontuacao(atualizarDados);

    iniciarCronometro(atualizarDados);
  }
}

function pararJogo(confirmarAntesParar = false, atualizarDados) {
  if (!confirmarAntesParar || confirm("Deseja realmente parar o jogo?")) {
    atualizarDados("jogoEmAndamento", false);
    clearInterval(intervalo);
    atualizarDados("intervaloCronometro", null);
    atualizarDados("tempoFormatado", "00:00");
  }
}

function iniciarCronometro(atualizarDados) {
  clearInterval(intervalo);
  intervalo = setInterval(() => {
    tempoRestante--;
    atualizarDados("tempoFormatado", formatarTempo(tempoRestante));

    if (tempoRestante <= 0) {
      pararJogo(false, atualizarDados);
    }
  }, 1000);
}

export { iniciarJogo, pararJogo };
