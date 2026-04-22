<template>
  <div class="game-container">
    <!-- Header -->
    <header class="game-header">
      <div class="header-content">
        <div class="game-title">
          <h1>Matematicando</h1>
          <p v-if="selectedRoom" class="room-name">{{ selectedRoom.nome }}</p>
          <p v-else class="room-name">Modo Livre</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">Tempo</span>
            <span class="stat-value">{{ tempoFormatado }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="game-main">
      <div class="game-layout">
        <!-- Left Panel - Ranking -->
        <aside class="ranking-panel">
          <Ranking 
            ref="rankingRef"
            :currentRoom="selectedRoom" 
            @change-room="changeRoom"
          />
        </aside>

        <!-- Right Panel - Game Area -->
        <section class="game-area">
          <!-- Score Cards -->
          <div class="score-cards">
            <div class="score-card correct">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="card-content">
                <div class="card-value">{{ acertos }}</div>
                <div class="card-label">Acertos</div>
              </div>
            </div>

            <div class="score-card errors">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="card-content">
                <div class="card-value">{{ erros }}</div>
                <div class="card-label">Erros</div>
              </div>
            </div>
          </div>

          <!-- Math Expression -->
          <div class="math-expression" :class="{ 'game-active': jogoEmAndamento }">
            <div class="expression-container">
              <div class="factor-display">
                <span class="factor">{{ fator1 }}</span>
              </div>
              <div class="operator-display">
                <span class="operator">{{ operador }}</span>
              </div>
              <div class="factor-display">
                <span class="factor">{{ fator2 }}</span>
              </div>
              <div class="equals-display">
                <span class="equals">=</span>
              </div>
              <div class="answer-input">
                <input
                  type="number"
                  ref="inputResultado"
                  v-model="respostaUsuario"
                  @keyup.enter="verificarResposta"
                  :disabled="!jogoEmAndamento"
                  class="answer-field"
                  placeholder="?"
                  :class="{ 'correct-answer': showCorrectFeedback, 'wrong-answer': showWrongFeedback }"
                />
              </div>
            </div>
          </div>

          <!-- Game Controls -->
          <div class="game-controls">
            <button
              @click="toggleJogo"
              :class="['control-btn', 'primary-btn', { 'game-running': jogoEmAndamento }]"
            >
              <svg v-if="!jogoEmAndamento" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              {{ jogoEmAndamento ? "Parar Jogo" : "Iniciar Jogo" }}
            </button>
            
            <button
              @click="verificarResposta"
              :disabled="!jogoEmAndamento"
              class="control-btn secondary-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Responder
            </button>
          </div>

          <!-- Game Status Message -->
          <div v-if="statusMessage" class="status-message" :class="statusType">
            {{ statusMessage }}
          </div>
        </section>
      </div>
    </main>

    <!-- Room Selection Modal -->
    <RoomSelection 
      :showRoomSelection="showRoomSelection"
      @room-selected="handleRoomSelected"
      @cancelled="handleRoomSelectionCancelled"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { iniciarJogo, pararJogo } from "../services/controler.js";
import { gerarOperacao, validarResultado, operacoes, operadorMatematicoAtual, getConfig } from "../services/game.js";
import { rankingService } from "../services/rankingService.js";
import { authService } from "@/services/authService.js";
import Ranking from "@/components/Ranking.vue";
import RoomSelection from "@/components/RoomSelection.vue";

const router = useRouter();

// Game State
const acertos = ref(0);
const erros = ref(0);
const fator1 = ref(0);
const fator2 = ref(0);
const operador = ref("+");
const respostaUsuario = ref("");
const jogoEmAndamento = ref(false);
const selectedRoom = ref(null);
const showRoomSelection = ref(false);
const statusMessage = ref("");
const statusType = ref("");

// Feedback states
const showCorrectFeedback = ref(false);
const showWrongFeedback = ref(false);

// Refs
const inputResultado = ref(null);
const rankingRef = ref(null);
const tempoSegundos = ref(0);
const intervaloCronometro = ref(null);

const tempoFormatado = computed(() => {
  const minutos = Math.floor(tempoSegundos.value / 60);
  const segundos = tempoSegundos.value % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(
    2,
    "0"
  )}`;
});

const atualizarDados = (campo, valor) => {
  switch (campo) {
    case "fator1":
      fator1.value = valor;
      break;
    case "fator2":
      fator2.value = valor;
      break;
    case "operador":
      operador.value = valor;
      break;
    case "respostaUsuario":
      respostaUsuario.value = valor;
      // Auto-focus when field is cleared
      if (valor === "") {
        setTimeout(() => {
          inputResultado.value?.focus();
        }, 0);
      }
      break;
    case "jogoEmAndamento":
      jogoEmAndamento.value = valor;
      if (valor) {
        respostaUsuario.value = "";
        // Focus without nextTick for immediate response
        setTimeout(() => {
          inputResultado.value?.focus();
        }, 0);
      }
      break;
    // tempoFormatado is computed, not writable - remove this case
    case "acertos":
      acertos.value = valor;
      break;
    case "erros":
      erros.value = valor;
      break;
  }
};

const zerarPontuacao = (atualizarDados) => {
  atualizarDados("acertos", 0);
  atualizarDados("erros", 0);
};

// Add a flag to prevent multiple rapid executions
let isProcessingAnswer = false;

const handleDocumentKeydown = (event) => {
  if (event.key === "Enter" && event.target === document.body) {
    if (!isProcessingAnswer) {
      isProcessingAnswer = true;
      verificarResposta();
      // Reset the flag after a short delay to prevent rapid-fire submissions
      setTimeout(() => {
        isProcessingAnswer = false;
      }, 100);
    }
    event.preventDefault();
  }
};

const toggleJogo = () => {
  if (jogoEmAndamento.value) {
    pararJogo(true, atualizarDados);
    clearInterval(intervaloCronometro.value);
    intervaloCronometro.value = null;
    statusMessage.value = "Jogo parado!";
    statusType.value = "info";
    
    // Save score when game ends
    saveGameScore();
  } else {
    if (authService.isAuthenticated()) {
      if (!selectedRoom.value) {
        showRoomSelection.value = true;
        return;
      }
      iniciarJogo(atualizarDados, selectedRoom.value.id);
    } else {
      iniciarJogo(atualizarDados, null);
    }
    
    tempoSegundos.value = 0;
    intervaloCronometro.value = setInterval(() => {
      tempoSegundos.value++;
      
      // Verificar se atingiu o tempo limite
      const configuracoes = getConfig();
      if (configuracoes && tempoSegundos.value >= configuracoes.limiteTempo) {
        console.log('Tempo limite atingido, parando jogo automaticamente');
        pararJogo(false, atualizarDados);
        clearInterval(intervaloCronometro.value);
        intervaloCronometro.value = null;
        statusMessage.value = `TEMPO ESGOTADO! Você fez ${acertos.value} acertos e ${erros.value} erros`;
        statusType.value = "warning";
        // Salvar score quando tempo limite é atingido
        saveGameScore();
      }
    }, 1000);
    statusMessage.value = "Jogo iniciado!";
    statusType.value = "success";
  }
  
  setTimeout(() => {
    statusMessage.value = "";
  }, 3000);
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
      
      // Verificar se atingiu o tempo limite
      const configuracoes = getConfig();
      if (configuracoes && tempoSegundos.value >= configuracoes.limiteTempo) {
        console.log('Tempo limite atingido, parando jogo automaticamente');
        pararJogo(false, atualizarDados);
        clearInterval(intervaloCronometro.value);
        intervaloCronometro.value = null;
        statusMessage.value = `TEMPO ESGOTADO! Você fez ${acertos.value} acertos e ${erros.value} erros`;
        statusType.value = "warning";
        // Salvar score quando tempo limite é atingido
        saveGameScore();
      }
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

const saveGameScore = async () => {
  if (!selectedRoom.value) return;
  
  const playerName = authService.getCurrentName() || authService.getCurrentUsername();
  
  try {
    console.log('=== saveGameScore Debug ===');
    console.log('Sala ID:', selectedRoom.value.id);
    console.log('Player Name:', playerName);
    console.log('Score:', { acertos: acertos.value, erros: erros.value, tempo: tempoSegundos.value });
    
    const result = await rankingService.savePlayerScore(
      selectedRoom.value.id,
      playerName,
      acertos.value,
      erros.value,
      tempoSegundos.value
    );
    
    console.log('Score salvo no banco:', result);
    
    // Trigger ranking refresh in the Ranking component
    if (rankingRef.value) {
      console.log('Disparando refresh do ranking...');
      setTimeout(() => {
        rankingRef.value.refreshRanking();
        console.log('Refresh do ranking disparado');
      }, 500); // Small delay to ensure score is saved
    } else {
      console.log('rankingRef.value é null/undefined');
    }
  } catch (error) {
    console.error('Erro ao salvar score:', error);
    // Don't show error to user to avoid interrupting game flow
  }
};

const verificarResposta = () => {
  if (!jogoEmAndamento.value) return;
  
  // Store current values to check if answer is correct
  const currentAcertos = acertos.value;
  const currentErros = erros.value;
  
  // Create a function that validarResultado can use to both get and set values
  const atualizarDadosParaValidacao = (campo, valor) => {
    if (valor !== undefined) {
      // Setting a value - update our reactive refs
      atualizarDados(campo, valor);
    } else {
      // Getting a value
      switch (campo) {
        case "fator1": return fator1.value;
        case "fator2": return fator2.value;
        case "respostaUsuario": return respostaUsuario.value;
        case "acertos": return acertos.value;
        case "erros": return erros.value;
        default: return null;
      }
    }
  };
  
  // Call validarResultado - this will update acertos/erros and generate new operation
  validarResultado(atualizarDadosParaValidacao);
  
  // Check what changed to determine if answer was correct
  const wasCorrect = acertos.value > currentAcertos;
  const wasWrong = erros.value > currentErros;
  
  if (wasCorrect) {
    showCorrectFeedback.value = true;
    statusMessage.value = "Resposta correta! 🎉";
    statusType.value = "success";
  } else if (wasWrong) {
    showWrongFeedback.value = true;
    statusMessage.value = "Resposta incorreta. Tente novamente!";
    statusType.value = "error";
  }
  
  setTimeout(() => {
    showCorrectFeedback.value = false;
    showWrongFeedback.value = false;
    respostaUsuario.value = "";
    nextTick(() => {
      inputResultado.value?.focus();
    });
  }, 1000);
  
  setTimeout(() => {
    statusMessage.value = "";
  }, 3000);
};

onMounted(() => {
  // Restore room from localStorage if available
  const savedRoom = localStorage.getItem('currentRoom');
  if (savedRoom) {
    try {
      selectedRoom.value = JSON.parse(savedRoom);
    } catch (error) {
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
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
  display: flex;
  flex-direction: column;
}

/* Header */
.game-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-title h1 {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.room-name {
  color: rgba(255, 255, 255, 0.8);
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
}

.header-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  opacity: 0.8;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

/* Main Content */
.game-main {
  flex: 1;
  padding: 2rem;
}

.game-layout {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  height: 100%;
}

/* Ranking Panel */
.ranking-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: fit-content;
}

/* Game Area */
.game-area {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Score Cards */
.score-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.score-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.score-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.score-card.correct {
  border-left: 4px solid #10b981;
}

.score-card.correct .card-icon {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.score-card.errors {
  border-left: 4px solid #ef4444;
}

.score-card.errors .card-icon {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.card-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Math Expression */
.math-expression {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.math-expression.game-active {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.expression-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  font-size: 3rem;
  font-weight: 700;
}

.factor-display, .operator-display, .equals-display {
  min-width: 80px;
  text-align: center;
}

.factor {
  color: #1f2937;
  display: inline-block;
  min-width: 60px;
}

.operator {
  color: #2563eb;
}

.equals {
  color: #6b7280;
}

.answer-input {
  flex: 1;
  max-width: 150px;
}

.answer-field {
  width: 100%;
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  border: 3px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  background: white;
  transition: all 0.2s;
}

.answer-field:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.answer-field.correct-answer {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
  animation: correct-pulse 0.6s ease;
}

.answer-field.wrong-answer {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
  animation: wrong-shake 0.6s ease;
}

@keyframes correct-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes wrong-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

/* Game Controls */
.game-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 180px;
  justify-content: center;
}

.primary-btn {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
}

.primary-btn.game-running {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.secondary-btn {
  background: white;
  color: #2563eb;
  border: 2px solid #2563eb;
}

.secondary-btn:hover:not(:disabled) {
  background: #2563eb;
  color: white;
  transform: translateY(-2px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Status Message */
.status-message {
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  animation: slide-in 0.3s ease;
}

.status-message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-message.info {
  background: rgba(37, 99, 235, 0.1);
  color: #1e40af;
  border: 1px solid rgba(37, 99, 235, 0.3);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .game-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .ranking-panel {
    order: 2;
  }
  
  .game-area {
    order: 1;
  }
}

@media (max-width: 768px) {
  .game-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .game-main {
    padding: 1rem;
  }
  
  .score-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .expression-container {
    font-size: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .factor-display, .operator-display, .equals-display {
    min-width: 60px;
  }
  
  .factor {
    min-width: 40px;
  }
  
  .answer-field {
    font-size: 2rem;
    padding: 0.75rem;
  }
  
  .game-controls {
    flex-direction: column;
  }
  
  .control-btn {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .expression-container {
    font-size: 1.5rem;
    gap: 0.5rem;
  }
  
  .answer-field {
    font-size: 1.5rem;
    padding: 0.5rem;
  }
  
  .math-expression {
    padding: 2rem 1rem;
  }
}
</style>
