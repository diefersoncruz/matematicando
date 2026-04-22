<template>
  <div class="room-ranking-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="back-navigation">
          <button @click="goBack" class="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar
          </button>
        </div>
        <div class="room-info" v-if="room">
          <h1>{{ room.nome }}</h1>
          <p class="room-description">{{ room.descricao || 'Sem descrição' }}</p>
          <div class="room-meta">
            <span class="type-badge" :class="`type-${room.tipo}`">
              {{ getSalaTypeLabel(room.tipo) }}
            </span>
            <span class="capacity-info" v-if="room.capacidade">
              Capacidade: {{ room.capacidade }} alunos
            </span>
            <span class="expiration-info" v-if="room.data_expiracao">
              Expira: {{ formatDate(room.data_expiracao) }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button @click="refreshRanking" class="btn btn-secondary" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Atualizar
        </button>
        <button @click="playInRoom" class="btn btn-primary" v-if="room">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Jogar nesta Sala
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-if="loading">
      <div class="loading-spinner"></div>
      <p>Carregando ranking...</p>
    </div>

    <!-- Error State -->
    <div class="error-state" v-if="error">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3>Erro ao carregar ranking</h3>
      <p>{{ error }}</p>
      <button @click="refreshRanking" class="btn btn-primary">Tentar Novamente</button>
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-if="!loading && !error && ranking.length === 0">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
        </svg>
      </div>
      <h3>Nenhum resultado encontrado</h3>
      <p>Esta sala ainda não possui pontuações. Seja o primeiro a jogar!</p>
      <button @click="playInRoom" class="btn btn-primary">Jogar Agora</button>
    </div>

    <!-- Ranking Content -->
    <div class="ranking-content" v-if="!loading && !error && ranking.length > 0">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ ranking.length }}</div>
            <div class="stat-label">Jogadores</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalPoints }}</div>
            <div class="stat-label">Pontos Totais</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ averagePoints }}</div>
            <div class="stat-label">Média de Pontos</div>
          </div>
        </div>
      </div>

      <!-- Ranking Table -->
      <div class="ranking-table-container">
        <h2>Ranking da Sala</h2>
        <div class="ranking-table">
          <div class="table-header">
            <div class="header-cell position">Posição</div>
            <div class="header-cell player">Jogador</div>
            <div class="header-cell score">Pontuação</div>
            <div class="header-cell date">Data</div>
          </div>
          <div class="table-body">
            <div 
              v-for="(player, index) in ranking" 
              :key="player.id"
              class="table-row"
              :class="{ 'current-user': isCurrentUser(player.user_id) }"
            >
              <div class="cell position">
                <div class="position-badge" :class="getPositionClass(index)">
                  {{ index + 1 }}
                </div>
              </div>
              <div class="cell player">
                <div class="player-info">
                  <div class="player-avatar">
                    {{ getPlayerInitial(player.name) }}
                  </div>
                  <div class="player-details">
                    <div class="player-name">{{ player.name }}</div>
                    <div class="player-email" v-if="player.email">{{ player.email }}</div>
                  </div>
                </div>
              </div>
              <div class="cell score">
                <div class="score-value">{{ player.score }}</div>
                <div class="score-badge" :class="getScoreClass(player.score)">
                  {{ getScoreLabel(player.score) }}
                </div>
              </div>
              <div class="cell date">
                {{ formatDate(player.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { rankingService } from '@/services/rankingService.js';
import { salasService } from '@/services/salasService.js';
import { authService } from '@/services/authService.js';

const route = useRoute();
const router = useRouter();

// Data
const loading = ref(false);
const error = ref(null);
const room = ref(null);
const ranking = ref([]);

// Computed
const totalPoints = computed(() => {
  return ranking.value.reduce((sum, player) => sum + player.score, 0);
});

const averagePoints = computed(() => {
  if (ranking.value.length === 0) return 0;
  return Math.round(totalPoints.value / ranking.value.length);
});

// Methods
const loadRoom = async () => {
  try {
    const roomId = route.params.id;
    if (!roomId) {
      error.value = 'ID da sala não fornecido';
      return;
    }

    const roomData = await salasService.getSalaById(roomId);
    room.value = roomData;
  } catch (err) {
    error.value = 'Erro ao carregar informações da sala: ' + err.message;
  }
};

const loadRanking = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const roomId = route.params.id;
    if (!roomId) {
      error.value = 'ID da sala não fornecido';
      return;
    }

    const rankingData = await rankingService.getSalaRanking(roomId);
    ranking.value = rankingData;
  } catch (err) {
    error.value = 'Erro ao carregar ranking: ' + err.message;
  } finally {
    loading.value = false;
  }
};

const refreshRanking = async () => {
  await Promise.all([loadRoom(), loadRanking()]);
};

const goBack = () => {
  router.push('/salas');
};

const playInRoom = () => {
  if (room.value) {
    // Store the selected room and navigate to game
    localStorage.setItem('currentRoom', JSON.stringify(room.value));
    router.push(`/jogo/${room.value.id}`);
  }
};

const getSalaTypeLabel = (tipo) => {
  const types = {
    'aula': 'Aula Regular',
    'estudo': 'Sala de Estudo',
    'prova': 'Sala de Prova',
    'tutoria': 'Tutoria'
  };
  return types[tipo] || tipo;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPlayerInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const getPositionClass = (index) => {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return '';
};

const getScoreClass = (score) => {
  if (score >= 100) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};

const getScoreLabel = (score) => {
  if (score >= 100) return 'Excelente';
  if (score >= 50) return 'Bom';
  return 'Iniciante';
};

const isCurrentUser = (userId) => {
  const currentUser = authService.getCurrentUser();
  return currentUser && currentUser.id === userId;
};

// Lifecycle
onMounted(() => {
  refreshRanking();
});
</script>

<style scoped>
.room-ranking-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
}

.back-navigation {
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
}

.room-info h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.room-description {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0 0 16px 0;
}

.room-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.type-aula { background: #dbeafe; color: #1e40af; }
.type-estudo { background: #f3e8ff; color: #6b21a8; }
.type-prova { background: #fee2e2; color: #991b1b; }
.type-tutoria { background: #d1fae5; color: #065f46; }

.capacity-info, .expiration-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* State Styles */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  color: #6b7280;
  margin-bottom: 16px;
}

.error-state h3, .empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.error-state p, .empty-state p {
  color: #6b7280;
  margin: 0 0 24px 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 4px;
}

/* Ranking Table */
.ranking-table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.ranking-table-container h2 {
  padding: 24px;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 120px 150px;
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 150px;
  padding: 16px 24px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row.current-user {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.cell {
  display: flex;
  align-items: center;
}

.position-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.position-badge.gold { background: #fef3c7; color: #92400e; }
.position-badge.silver { background: #f3f4f6; color: #374151; }
.position-badge.bronze { background: #fed7aa; color: #9a3412; }
.position-badge:not(.gold):not(.silver):not(.bronze) { 
  background: #f3f4f6; 
  color: #6b7280; 
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.player-name {
  font-weight: 500;
  color: #1f2937;
}

.player-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.score-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.score-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 8px;
}

.score-badge.high { background: #d1fae5; color: #065f46; }
.score-badge.medium { background: #fef3c7; color: #92400e; }
.score-badge.low { background: #f3f4f6; color: #6b7280; }

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .table-header, .table-row {
    grid-template-columns: 60px 1fr 80px;
  }

  .cell.date {
    display: none;
  }

  .score-badge {
    display: none;
  }
}
</style>
