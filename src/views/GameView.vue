<template>
  <div class="container">
    <div class="div-esquerda">
      <Ranking />
    </div>
    <div class="div-direita">
      <div class="opcoes">
        <div id="divAcertos" class="score-box score-box--green">
          <label for="inputAcertos" class="score-label">Acertos:</label>
          <span id="inputAcertos" class="score-value">{{ acertos }}</span>
        </div>
        <div id="divCronometro" class="cronometro">
          <span id="minuto">{{ tempoFormatado }}</span>
        </div>
        <div id="divErros" class="score-box score-box--red">
          <label for="inputErros" class="score-label">Erros:</label>
          <span id="inputErros" class="score-value">{{ erros }}</span>
        </div>
      </div>

      <div class="expressao">
        <input
          type="number"
          id="inputFator1"
          class="input-fator"
          :value="fator1"
          readonly
          disabled
        />
        <span id="inputOperador" class="operador">{{ operador }}</span>
        <input
          type="number"
          id="inputFator2"
          class="input-fator"
          :value="fator2"
          readonly
          disabled
        />
        <span class="igual">=</span>
        <input
          type="number"
          id="inputResultado"
          class="input-resultado"
          ref="inputResultado"
          v-model="respostaUsuario"
          @keyup.enter="verificarResposta"
          :disabled="!jogoEmAndamento"
        />
      </div>

      <div class="botoes">
        <button
          id="btnIniciarPararJogo"
          class="btn btn-iniciar"
          @click="iniciarOuPararJogo"
        >
          {{ jogoEmAndamento ? "Parar Jogo" : "Iniciar Jogo" }}
        </button>
        <button
          id="btn-responder"
          class="btn btn-responder"
          @click="verificarResposta"
          :disabled="!jogoEmAndamento"
        >
          Responder
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { iniciarJogo, pararJogo } from "../services/controler.js";
import { gerarOperacao, validarResultado } from "../services/game.js";
import Ranking from "@/components/Ranking.vue";

const acertos = ref(0);
const erros = ref(0);
const fator1 = ref(0);
const fator2 = ref(0);
const operador = ref("+");
const respostaUsuario = ref(0);
const jogoEmAndamento = ref(false);
const tempoSegundos = ref(0);
const intervaloCronometro = ref(null);
const inputResultado = ref(null);

const tempoFormatado = computed(() => {
  const minutos = Math.floor(tempoSegundos.value / 60);
  const segundos = tempoSegundos.value % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(
    2,
    "0"
  )}`;
});

const atualizarDados = (campo, valor = null) => {
  if (valor !== null) {
    if (campo === "acertos") acertos.value = valor;
    if (campo === "erros") erros.value = valor;
    if (campo === "fator1") fator1.value = valor;
    if (campo === "fator2") fator2.value = valor;
    if (campo === "operador") operador.value = valor;
    if (campo === "respostaUsuario") respostaUsuario.value = valor;
    if (campo === "jogoEmAndamento") jogoEmAndamento.value = valor;
    if (campo === "tempoSegundos") tempoSegundos.value = valor;
  }
  if (campo === "acertos") return acertos.value;
  if (campo === "erros") return erros.value;
  if (campo === "fator1") return fator1.value;
  if (campo === "fator2") return fator2.value;
  if (campo === "operador") return operador.value;
  if (campo === "respostaUsuario") return respostaUsuario.value;
  if (campo === "jogoEmAndamento") return jogoEmAndamento.value;
  if (campo === "tempoSegundos") return tempoSegundos.value;
};

const handleDocumentKeydown = (event) => {
  if (event.key === "Enter" && event.target === document.body) {
    verificarResposta();
    event.preventDefault();
  }
};

const iniciarOuPararJogo = () => {
  if (jogoEmAndamento.value) {
    pararJogo(true, atualizarDados);
    clearInterval(intervaloCronometro.value);
    intervaloCronometro.value = null;
  } else {
    iniciarJogo(atualizarDados);
    tempoSegundos.value = 0;
    intervaloCronometro.value = setInterval(() => {
      tempoSegundos.value++;
    }, 1000);
  }
};

const verificarResposta = () => {
  if (jogoEmAndamento.value) {
    validarResultado(atualizarDados);
    nextTick(() => {
      inputResultado.value.focus();
    });
  }
};

onMounted(() => {
  gerarOperacao(atualizarDados);
  document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleDocumentKeydown);
});
</script>
