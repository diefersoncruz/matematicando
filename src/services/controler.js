import { gerarOperacao, zerarPontuacao, loadConfig } from "./game.js";
import { configService } from "./configService.js";

// Import the configuracoes variable from game.js
let configuracoes = {
  limiteTempo: 60,
  limiteFatorA: 10,
  limiteNegativoFatorA: 0,
  limiteFatorB: 10,
  limiteNegativoFatorB: 0,
  operacoesPermitidas: {
    operacoesDeDivisao: true,
    operacoesDeMultiplicacao: true,
    operacoesDeAdicao: true,
    operacoesDeSubtracao: true,
  },
  exibicao: {
    exibirRespostaCerta: false,
  },
};

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
  if (confirm("Pronto para começar?")) {
    // Load configuration from Supabase if salaId is provided
    if (salaId) {
      await loadConfig(salaId);
    }
    
    tempoRestante = configuracoes.limiteTempo;
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

// Get current configuration
function getConfig() {
  return configuracoes;
}

export { iniciarJogo, pararJogo, getConfig };
