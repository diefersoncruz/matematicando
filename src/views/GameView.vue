<template>
  <div class="container">
    <div class="div-esquerda">
      <Ranking :currentRoom="selectedRoom" @change-room="changeRoom" />
    </div>
    <div class="div-direita">
      <!-- No Room Selected State -->
      <div class="no-room-state" v-if="!selectedRoom">
        <div class="no-room-content">
          <div class="no-room-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </div>
          <h2>Selecione uma Sala para Jogar</h2>
          <p>Para começar a jogar, você precisa selecionar uma sala de matemática.</p>
          <p class="sub-text">Escolha uma sala existente ou crie uma nova sala para iniciar sua sessão de jogo.</p>
          <div class="no-room-actions">
            <button @click="showRoomSelection = true" class="btn btn-primary btn-large">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Selecionar Sala
            </button>
            <button @click="goToCreateRoom" class="btn btn-secondary btn-large">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Criar Nova Sala
            </button>
          </div>
        </div>
      </div>
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
          :disabled="!selectedRoom"
        >
          {{ jogoEmAndamento ? "Parar Jogo" : selectedRoom ? "Iniciar Jogo" : "Selecione uma Sala" }}
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
    
    // Save score when game ends
    saveGameScore();
  } else {
    if (!selectedRoom.value) {
      showRoomSelection.value = true;
      return;
    }
    iniciarJogo(atualizarDados);
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
    iniciarJogo(atualizarDados);
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
    // This will be handled by the component's watch mechanism
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
  
  // Show room selection if no room is available (with small delay for data loading)
  if (!selectedRoom.value) {
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

/* No Room State */
.no-room-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.no-room-content {
  text-align: center;
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  max-width: 600px;
}

.no-room-icon {
  color: #d1d5db;
  margin-bottom: 32px;
}

.no-room-content h2 {
  margin: 0 0 16px 0;
  font-size: 28px;
  color: #1f2937;
  font-weight: 600;
}

.no-room-content p {
  margin: 0 0 12px 0;
  color: #6b7280;
  line-height: 1.6;
  font-size: 16px;
}

.no-room-content .sub-text {
  margin: 0 0 32px 0;
  color: #9ca3af;
  font-size: 14px;
}

.no-room-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Update button disabled state */
.btn-iniciar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-iniciar:disabled:hover {
  transform: none;
  box-shadow: none;
}

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
