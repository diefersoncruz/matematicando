import { gerarOperacao, zerarPontuacao } from "./game.js";
import { configuracoes } from "../data/config.js";

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

function iniciarJogo(atualizarDados) {
  if (confirm("Pronto para começar?")) {
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

export { iniciarJogo, pararJogo };
