<template>
  <div class="container">
    <div class="div-esquerda">
      <Ranking 
        ref="rankingRef"
        :currentRoom="selectedRoom" 
        @change-room="changeRoom"
      />
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
          @click="toggleJogo"
        >
          {{ jogoEmAndamento ? "Parar Jogo" : selectedRoom ? "Iniciar Jogo" : "Iniciar Jogo" }}
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

  <!-- Room Selection Modal -->
  <RoomSelection 
    :showRoomSelection="showRoomSelection"
    @room-selected="handleRoomSelected"
    @cancelled="handleRoomSelectionCancelled"
  />
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { iniciarJogo, pararJogo } from "../services/controler.js";
import { gerarOperacao, validarResultado } from "../services/game.js";
import { rankingService } from "../services/rankingService.js";
import { authService } from "../services/authService.js";
import Ranking from "@/components/Ranking.vue";
import RoomSelection from "@/components/RoomSelection.vue";

const router = useRouter();

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

// Room management
const selectedRoom = ref(null);
const showRoomSelection = ref(false);

const tempoFormatado = computed(() => {
  const minutos = Math.floor(tempoSegundos.value / 60);
  const segundos = tempoSegundos.value % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(
    2,
    "0"
  )}`;
});

const atualizarDados = (campo, valor = null) => {
  console.log('atualizarDados called:', campo, '=', valor);
  
  if (valor !== null) {
    if (campo === "acertos") {
      acertos.value = valor;
      console.log('acertos updated to:', valor);
    }
    if (campo === "erros") {
      erros.value = valor;
      console.log('erros updated to:', valor);
    }
    if (campo === "fator1") {
      fator1.value = valor;
      console.log('fator1 updated to:', valor);
    }
    if (campo === "fator2") {
      fator2.value = valor;
      console.log('fator2 updated to:', valor);
    }
    if (campo === "operador") {
      operador.value = valor;
      console.log('operador updated to:', valor);
    }
    if (campo === "respostaUsuario") {
      respostaUsuario.value = valor;
      console.log('respostaUsuario updated to:', valor);
    }
    if (campo === "jogoEmAndamento") {
      jogoEmAndamento.value = valor;
      console.log('jogoEmAndamento updated to:', valor);
    }
    if (campo === "tempoSegundos") {
      tempoSegundos.value = valor;
      console.log('tempoSegundos updated to:', valor);
    }
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

const toggleJogo = () => {
  console.log('toggleJogo called - jogoEmAndamento:', jogoEmAndamento.value);
  console.log('User authenticated:', authService.isAuthenticated());
  console.log('Selected room:', selectedRoom.value);
  
  if (jogoEmAndamento.value) {
    console.log('Stopping game...');
    pararJogo(true, atualizarDados);
    clearInterval(intervaloCronometro.value);
    intervaloCronometro.value = null;
    
    // Save score when game ends
    saveGameScore();
  } else {
    console.log('Starting game...');
    // Check if user is authenticated
    if (authService.isAuthenticated()) {
      // Authenticated users can play with or without room
      if (!selectedRoom.value) {
        console.log('No room selected for authenticated user, showing room selection');
        showRoomSelection.value = true;
        return;
      }
      console.log('Authenticated user starting game with room:', selectedRoom.value.id);
      iniciarJogo(atualizarDados, selectedRoom.value.id);
    } else {
      // Anonymous users play without room (default settings)
      console.log('Anonymous user starting game with default settings');
      iniciarJogo(atualizarDados, null);
    }
    
    tempoSegundos.value = 0;
    intervaloCronometro.value = setInterval(() => {
      tempoSegundos.value++;
    }, 1000);
  }
};

// Room management methods
const handleRoomSelected = (room) => {
  selectedRoom.value = room;
  showRoomSelection.value = false;
  
  // Store room context for game session
  localStorage.setItem('currentRoom', JSON.stringify(room));
  
  // Auto-start game after room selection
  nextTick(() => {
    iniciarJogo(atualizarDados, room.id);
    tempoSegundos.value = 0;
    intervaloCronometro.value = setInterval(() => {
      tempoSegundos.value++;
    }, 1000);
  });
};

const handleRoomSelectionCancelled = () => {
  showRoomSelection.value = false;
};

const changeRoom = () => {
  if (jogoEmAndamento.value) {
    // Ask user to stop game first
    if (confirm('Para trocar de sala, você precisa parar o jogo atual. Deseja continuar?')) {
      pararJogo(true, atualizarDados);
      clearInterval(intervaloCronometro.value);
      intervaloCronometro.value = null;
      showRoomSelection.value = true;
    }
  } else {
    showRoomSelection.value = true;
  }
};

const getRoomTypeLabel = (tipo) => {
  const tipos = {
    aula: "Aula Regular",
    estudo: "Sala de Estudo",
    prova: "Sala de Prova",
    tutoria: "Tutoria"
  };
  return tipos[tipo] || "Outro";
};

const goToCreateRoom = () => {
  router.push('/salas/criar');
};

const goToLogin = () => {
  router.push('/login');
};

const rankingRef = ref(null);

const saveGameScore = async () => {
  if (!selectedRoom.value) return;
  
  const playerName = authService.getCurrentUsername();
  
  try {
    await rankingService.savePlayerScore(
      selectedRoom.value.id,
      playerName,
      acertos.value,
      erros.value,
      tempoSegundos.value
    );
    
    // Trigger ranking refresh in the Ranking component
    if (rankingRef.value) {
      setTimeout(() => {
        rankingRef.value.refreshRanking();
      }, 500); // Small delay to ensure score is saved
    }
  } catch (error) {
    console.error('Error saving game score:', error);
    // Don't show error to user to avoid interrupting game flow
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
  // Restore room from localStorage if available
  const savedRoom = localStorage.getItem('currentRoom');
  if (savedRoom) {
    try {
      selectedRoom.value = JSON.parse(savedRoom);
    } catch (error) {
      console.error('Error parsing saved room:', error);
      localStorage.removeItem('currentRoom');
    }
  }
  
  // Show room selection only for authenticated users if no room is available
  if (!selectedRoom.value && authService.isAuthenticated()) {
    setTimeout(() => {
      showRoomSelection.value = true;
    }, 100);
  }
  
  gerarOperacao(atualizarDados);
  document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleDocumentKeydown);
});
</script>

<style scoped>


/* Responsive adjustments */
@media (max-width: 768px) {
  .room-info {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .room-details {
    flex-direction: column;
    gap: 8px;
  }
  

}
</style>
