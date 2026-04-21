<template>
  <div class="user-rooms-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Minhas Salas</h1>
        <p>Gerencie suas salas de matemática</p>
      </div>
      <div class="header-actions">
        <button @click="showCreateRoom = true" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Nova Sala
        </button>
        <button @click="showJoinRoom = true" class="btn btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Entrar em Sala
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-container" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalRooms }}</span>
          <span class="stat-label">Total de Salas</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon admin">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.adminRooms }}</span>
          <span class="stat-label">Salas de Admin</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon member">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.memberRooms }}</span>
          <span class="stat-label">Salas de Membro</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-if="loading">
      <div class="loading-spinner"></div>
      <p>Carregando suas salas...</p>
    </div>

    <!-- Error State -->
    <div class="error-state" v-else-if="error">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h3>Erro ao carregar salas</h3>
      <p>{{ error }}</p>
      <button @click="loadUserRooms" class="btn btn-primary">Tentar Novamente</button>
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-else-if="userRooms.length === 0">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
      </div>
      <h3>Você ainda não está em nenhuma sala</h3>
      <p>Entre em uma sala existente ou crie sua própria sala para começar a jogar!</p>
      <div class="empty-actions">
        <button @click="showJoinRoom = true" class="btn btn-primary btn-large">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Entrar em Sala
        </button>
        <button @click="showCreateRoom = true" class="btn btn-secondary btn-large">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Nova Sala
        </button>
      </div>
    </div>

    <!-- Rooms Grid -->
    <div class="rooms-grid" v-else>
      <div 
        v-for="userRoom in userRooms" 
        :key="userRoom.id"
        class="room-card"
        @click="goToRoom(userRoom.salas.id)"
      >
        <div class="room-header">
          <div class="room-info">
            <h3>{{ userRoom.salas.nome }}</h3>
            <span class="room-type">{{ getRoomTypeLabel(userRoom.salas.tipo) }}</span>
          </div>
          <div class="room-role" :class="userRoom.role">
            {{ getRoleLabel(userRoom.role) }}
          </div>
        </div>
        
        <div class="room-description" v-if="userRoom.salas.descricao">
          <p>{{ userRoom.salas.descricao }}</p>
        </div>
        
        <div class="room-meta">
          <div class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Entrou em {{ formatDate(userRoom.joined_at) }}</span>
          </div>
          <div class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Acessado em {{ formatDate(userRoom.last_accessed) }}</span>
          </div>
        </div>
        
        <div class="room-actions">
          <button @click.stop="playInRoom(userRoom.salas.id)" class="btn btn-play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Jogar
          </button>
          <button 
            v-if="userRoom.role === 'admin'" 
            @click.stop="editRoomConfiguration(userRoom.salas)" 
            class="btn btn-config"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 7.76l4.24 4.24M20.46 16.24l-4.24 4.24M7.76 1.54l-4.24 4.24"/>
            </svg>
            Configurar
          </button>
          <button @click.stop="leaveRoom(userRoom)" class="btn btn-leave">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </div>
    </div>

    <!-- Join Room Modal -->
    <RoomSelection 
      v-if="showJoinRoom"
      :showRoomSelection="showJoinRoom"
      @room-selected="handleRoomJoined"
      @cancelled="showJoinRoom = false"
    />

    <!-- Create Room Modal -->
    <SalaFormModal 
      :showModal="showCreateRoom"
      @sala-created="handleRoomCreated"
      @cancelled="showCreateRoom = false"
    />

    <!-- Room Configuration Modal -->
    <RoomConfigurationModal
      :showModal="showConfigModal"
      :room="selectedRoom"
      :isEditing="true"
      @close="closeConfigModal"
      @saved="handleConfigurationSaved"
    />

    <!-- Login Modal -->
    <LoginModal
      :showModal="showLoginModal"
      @login-success="handleLoginSuccess"
      @cancelled="showLoginModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { userRoomService } from '@/services/userRoomService.js';
import { authService } from '@/services/authService.js';
import RoomSelection from '@/components/RoomSelection.vue';
import SalaFormModal from '@/components/SalaFormModal.vue';
import RoomConfigurationModal from '@/components/RoomConfigurationModal.vue';
import LoginModal from '@/components/LoginModal.vue';

const router = useRouter();

// Data
const userRooms = ref([]);
const stats = ref(null);
const loading = ref(false);
const error = ref(null);
const showJoinRoom = ref(false);
const showCreateRoom = ref(false);
const showConfigModal = ref(false);
const showLoginModal = ref(false);
const selectedRoom = ref(null);

// Methods
const loadUserRooms = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    console.log('=== Loading user rooms debug start ===');
    
    // Check if user is authenticated
    const currentUser = authService.getCurrentUser();
    console.log('Current user from authService:', currentUser);
    
    if (!currentUser) {
      console.log('No authenticated user found');
      error.value = 'Usuário não autenticado';
      return;
    }
    
    console.log('User ID:', currentUser.id);
    console.log('User Username:', currentUser.username);
    
    // Try to get user rooms
    console.log('Calling userRoomService.getUserRooms()...');
    const rooms = await userRoomService.getUserRooms();
    console.log('User rooms loaded successfully:', rooms);
    console.log('Number of rooms:', rooms.length);
    
    userRooms.value = rooms;
    
    // Try to get stats (this might be failing)
    console.log('Calling userRoomService.getUserRoomStats()...');
    try {
      const userStats = await userRoomService.getUserRoomStats();
      console.log('User stats loaded successfully:', userStats);
      stats.value = userStats;
    } catch (statsError) {
      console.error('Error loading stats (but rooms loaded):', statsError);
      // Don't fail the whole loading if stats fail
      stats.value = null;
    }
    
    console.log('=== Loading user rooms debug end ===');
  } catch (err) {
    console.error('=== Error loading user rooms ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    error.value = err.message || 'Não foi possível carregar suas salas';
  } finally {
    loading.value = false;
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

const getRoleLabel = (role) => {
  const roles = {
    admin: "Administrador",
    member: "Membro",
    student: "Estudante"
  };
  return roles[role] || role;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

const goToRoom = (roomId) => {
  router.push(`/jogo?roomId=${roomId}`);
};

const playInRoom = (roomId) => {
  // Update last accessed
  userRoomService.updateRoomAccess(roomId);
  router.push(`/jogo?roomId=${roomId}`);
};

const leaveRoom = async (userRoom) => {
  if (confirm(`Tem certeza que deseja sair da sala "${userRoom.salas.nome}"?`)) {
    try {
      await userRoomService.leaveRoom(userRoom.salas.id);
      await loadUserRooms(); // Refresh the list
    } catch (err) {
      alert('Erro ao sair da sala: ' + err.message);
    }
  }
};

const handleRoomJoined = async (room) => {
  try {
    await userRoomService.joinRoom(room.id);
    await loadUserRooms(); // Refresh the list
    showJoinRoom.value = false;
  } catch (err) {
    alert('Erro ao entrar na sala: ' + err.message);
  }
};

const handleRoomCreated = async () => {
  await loadUserRooms(); // Refresh the list
  showCreateRoom.value = false;
};

const editRoomConfiguration = (room) => {
  selectedRoom.value = room;
  showConfigModal.value = true;
};

const closeConfigModal = () => {
  showConfigModal.value = false;
  selectedRoom.value = null;
};

const handleConfigurationSaved = (config) => {
  console.log('Configuration saved:', config);
  // Could show a success message or refresh data if needed
};

const handleLoginSuccess = () => {
  showLoginModal.value = false;
  loadUserRooms();
};

// Lifecycle
onMounted(() => {
  if (!authService.isAuthenticated()) {
    showLoginModal.value = true; // Show login modal if not authenticated
    return;
  }
  
  loadUserRooms();
});
</script>

<style scoped>
/* Container */
.user-rooms-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.header-content p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

/* Statistics */
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.admin {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.member {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.error-state p {
  margin: 0 0 2rem 0;
  font-size: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 2rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.empty-state p {
  margin: 0 0 2rem 0;
  font-size: 1rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Rooms Grid */
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.room-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.room-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.room-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.room-type {
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 500;
}

.room-role {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  text-transform: uppercase;
}

.room-role.admin {
  background: #fef3c7;
  color: #92400e;
}

.room-role.member {
  background: #dbeafe;
  color: #1e40af;
}

.room-role.student {
  background: #d1fae5;
  color: #065f46;
}

.room-description {
  padding: 1rem 1.5rem;
}

.room-description p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.room-meta {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.room-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-play {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  flex: 1;
}

.btn-leave {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-config {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-large {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .user-rooms-container {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .rooms-grid {
    grid-template-columns: 1fr;
  }
  
  .empty-actions {
    flex-direction: column;
  }
}
</style>
