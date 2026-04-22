<template>
  <div class="ranking-container">
    <!-- Room Header -->
    <div class="room-header" v-if="currentRoom">
      <div class="room-info">
        <div class="room-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </div>
        <div class="room-details">
          <h2 class="room-name">{{ currentRoom.nome }}</h2>
          <span class="room-type">{{ getRoomTypeLabel(currentRoom.tipo) }}</span>
        </div>
      </div>
      <div class="ranking-stats">
        <div class="stat-item">
          <span class="stat-value">{{ totalPlayers }}</span>
          <span class="stat-label">Jogadores</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalHits }}</span>
          <span class="stat-label">Acertos</span>
        </div>
      </div>
    </div>

    <!-- No Room State -->
    <div class="no-room-state" v-else>
      <div class="no-room-content">
        <!-- Anonymous User -->
        <div v-if="!authService.isAuthenticated()">
          <div class="no-room-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h3>Bem-vindo, Jogador Anônimo!</h3>
          <p>Você pode jogar gratuitamente no modo padrão.</p>
          <p class="sub-text">Para acessar salas personalizadas e salvar seu progresso, <button @click="openLoginModal" class="login-link">crie uma conta</button>.</p>
        </div>
        
        <!-- Authenticated User -->
        <div v-else>
          <div class="no-room-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </div>
          <h3>Olá, {{ authService.getCurrentName() || authService.getCurrentUsername() }}!</h3>
          <p>Selecione uma sala para ver o ranking e jogar com configurações personalizadas.</p>
          <div class="room-actions">
            <button @click="$emit('change-room')" class="btn btn-small btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Selecionar Sala
            </button>
            <a href="/salas/criar" class="btn btn-small btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Criar Sala
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Ranking Table -->
    <div class="ranking-table" v-if="currentRoom">
      <div class="table-header">
        <h3>Ranking da Sala</h3>
        <div class="table-controls">
          <select v-model="sortBy" class="sort-select">
            <option value="hits">Por Acertos</option>
            <option value="name">Por Nome</option>
          </select>
        </div>
      </div>
      
      <div class="table-container">
        <!-- Loading State -->
        <div class="loading-state" v-if="loading">
          <div class="loading-spinner"></div>
          <p>Carregando ranking...</p>
        </div>
        
        <!-- Error State -->
        <div class="error-state" v-else-if="error">
          <div class="error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h3>Erro ao carregar ranking</h3>
          <p>{{ error }}</p>
          <button @click="loadRankingData" class="btn btn-primary">Tentar Novamente</button>
        </div>
        
        <!-- Ranking Table -->
        <table class="ranking-table-content" v-else-if="sortedRanking.length > 0">
          <thead>
            <tr>
              <th class="pos-col">Pos.</th>
              <th class="name-col">Nome</th>
              <th class="hits-col">Acertos</th>
              <th class="accuracy-col">Precisão</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(player, index) in sortedRanking" 
              :key="player.id"
              :class="{ 'current-user': player.isCurrentUser }"
            >
              <td class="pos-col">
                <span :class="getPositionClass(player.position)">
                  {{ player.position }}
                </span>
              </td>
              <td class="name-col">
                <div class="player-info">
                  <span class="player-name">{{ player.name }}</span>
                  <span class="player-badge" v-if="player.isCurrentUser">Você</span>
                </div>
              </td>
              <td class="hits-col">
                <span class="hits-value">{{ player.hits }}</span>
              </td>
              <td class="accuracy-col">
                <span class="accuracy-value">{{ player.accuracy }}%</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Empty State -->
        <div class="empty-state" v-else>
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <p>Nenhum jogador na sala ainda</p>
          <span class="empty-subtext">Seja o primeiro a jogar!</span>
        </div>
      </div>
    </div>
    
    <!-- Change Room Button -->
    <div class="ranking-actions" v-if="currentRoom">
      <button @click="changeRoom" class="btn-change-room">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18m-9-9v18"/>
        </svg>
        Trocar Sala
      </button>
    </div>
  </div>

<!-- Login Modal -->
<LoginModal
  :showModal="showLoginModal"
  @login-success="handleLoginSuccess"
  @cancelled="showLoginModal = false"
  @close="showLoginModal = false"
/>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { rankingService } from "@/services/rankingService.js";
import { authService } from "@/services/authService.js";
import LoginModal from "@/components/LoginModal.vue";

// Props
const props = defineProps({
  currentRoom: {
    type: Object,
    default: null
  }
});

// Emits
const emit = defineEmits(['change-room']);

// Data
const rankingData = ref([]);
const sortBy = ref('hits');
const currentUser = ref(null);
const loading = ref(false);
const error = ref(null);
const showLoginModal = ref(false);

// Computed properties
const sortedRanking = computed(() => {
  if (!rankingData.value.length) return [];
  
  const sorted = [...rankingData.value];
  if (sortBy.value === 'hits') {
    return sorted.sort((a, b) => b.hits - a.hits);
  } else if (sortBy.value === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
});

const totalPlayers = computed(() => rankingData.value.length);
const totalHits = computed(() => rankingData.value.reduce((sum, player) => sum + player.hits, 0));

// Methods
const getRoomTypeLabel = (tipo) => {
  const tipos = {
    aula: "Aula Regular",
    estudo: "Sala de Estudo",
    prova: "Sala de Prova",
    tutoria: "Tutoria"
  };
  return tipos[tipo] || "Outro";
};

const getPositionClass = (position) => {
  if (position === 1) return 'position-gold';
  if (position === 2) return 'position-silver';
  if (position === 3) return 'position-bronze';
  return 'position-normal';
};

const changeRoom = () => {
  emit('change-room');
};

const openLoginModal = () => {
  showLoginModal.value = true;
};

const handleLoginSuccess = () => {
  showLoginModal.value = false;
  // Refresh ranking data after login
  loadRankingData();
};

const generateMockData = () => {
  // Mock data for demonstration - replace with real data from your backend
  const mockPlayers = [
    { id: 1, name: 'João Silva', hits: 45, accuracy: 85, isCurrentUser: true },
    { id: 2, name: 'Maria Santos', hits: 38, accuracy: 92, isCurrentUser: false },
    { id: 3, name: 'Pedro Oliveira', hits: 42, accuracy: 78, isCurrentUser: false },
    { id: 4, name: 'Ana Costa', hits: 35, accuracy: 88, isCurrentUser: false },
    { id: 5, name: 'Lucas Ferreira', hits: 48, accuracy: 95, isCurrentUser: false },
  ];
  
  rankingData.value = mockPlayers;
};

const loadRankingData = async () => {
  if (!props.currentRoom) {
    rankingData.value = [];
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    const ranking = await rankingService.getSalaRanking(props.currentRoom.id);
    const currentUsername = authService.getCurrentUsername();
    rankingData.value = ranking.map(score => ({
      id: score.id,
      name: score.player_name,
      hits: score.hits,
      errors: score.errors,
      accuracy: score.accuracy,
      position: score.rank_position,
      isCurrentUser: score.player_name === currentUsername,
      gameDate: score.game_date
    }));
  } catch (error) {
    console.error('Error loading ranking data:', error);
    error.value = error.message || 'Não foi possível carregar o ranking';
    rankingData.value = [];
  } finally {
    loading.value = false;
  }
};

// Expose methods for parent components
defineExpose({
  refreshRanking: loadRankingData
});

// Lifecycle
onMounted(() => {
  loadRankingData();
});

watch(() => props.currentRoom, () => {
  loadRankingData();
});
</script>

<style scoped>
/* Ranking Container */
.ranking-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Room Header */
.room-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-details h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.room-type {
  font-size: 12px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 12px;
}

.ranking-stats {
  display: flex;
  gap: 20px;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

/* Ranking Actions */
.ranking-actions {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: center;
}

.btn-change-room {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.btn-change-room:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

/* No Room State */
.no-room-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.no-room-content {
  text-align: center;
}

.no-room-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.no-room-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.no-room-content p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

/* Ranking Table */
.ranking-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.sort-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #374151;
}

.table-container {
  flex: 1;
  overflow-y: auto;
}

.ranking-table-content {
  width: 100%;
  border-collapse: collapse;
}

.ranking-table-content th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e5e7eb;
}

.ranking-table-content td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.ranking-table-content tr:hover {
  background: #f9fafb;
}

.ranking-table-content tr.current-user {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

/* Column Styles */
.pos-col {
  width: 60px;
  text-align: center;
}

.position-gold {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #854d0e;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.position-silver {
  background: linear-gradient(135deg, #c0c0c0, #e5e5e5);
  color: #374151;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.position-bronze {
  background: linear-gradient(135deg, #cd7f32, #e6a05c);
  color: white;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.position-normal {
  background: #f3f4f6;
  color: #6b7280;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.name-col {
  width: auto;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-name {
  font-weight: 500;
  color: #1f2937;
}

.player-badge {
  background: #3b82f6;
  color: white;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.hits-col {
  width: 80px;
  text-align: center;
}

.hits-value {
  font-weight: 600;
  color: #059669;
  font-size: 16px;
}

.accuracy-col {
  width: 80px;
  text-align: center;
}

.accuracy-value {
  font-weight: 500;
  color: #6b7280;
  font-size: 14px;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.error-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.error-state p {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: #1f2937;
}

/* Login link */
.login-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.login-link:hover {
  text-decoration: underline;
}

/* Room actions */
.room-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-small.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-small.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-small.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-small.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.btn-small svg {
  flex-shrink: 0;
}

/* No room content adjustments */
.no-room-content .sub-text {
  margin-top: 8px;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.4;
}

.empty-subtext {
  font-size: 14px;
  color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .ranking-stats {
    justify-content: center;
  }
  
  .table-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .ranking-table-content th,
  .ranking-table-content td {
    padding: 8px 12px;
  }
  
  .player-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .btn-change-room {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-change-room:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
  
  .btn-change-room {
    width: 100%;
    justify-content: center;
  }
}
</style>
