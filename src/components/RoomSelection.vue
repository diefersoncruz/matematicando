<template>
  <div class="room-selection-overlay" v-if="showRoomSelection">
    <div class="room-selection-modal">
      <div class="modal-header">
        <h2>Selecione uma Sala</h2>
        <p>Escolha uma sala de matemática para começar a jogar</p>
        
        <!-- Search Input -->
        <div class="search-container" v-if="rooms.length > 0">
          <div class="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Buscar sala por nome..."
              class="search-input"
            />
            <button 
              v-if="searchQuery" 
              @click="clearSearch" 
              class="clear-search-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="search-results" v-if="searchQuery">
            <span class="results-count">
              {{ filteredRooms.length }} {{ filteredRooms.length === 1 ? 'sala encontrada' : 'salas encontradas' }}
            </span>
          </div>
        </div>
        
        <div class="instruction" v-if="filteredRooms.length > 0 && !selectedRoom && !searchQuery">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Clique em uma sala para selecioná-la
        </div>
      </div>
      
      <div class="loading-state" v-if="loading">
        <div class="loading-spinner"></div>
        <p>Carregando salas...</p>
      </div>
      
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
        <button @click="fetchRooms" class="btn btn-primary">Tentar Novamente</button>
      </div>
      
      <!-- No Search Results -->
      <div class="no-search-results" v-else-if="searchQuery && filteredRooms.length === 0">
        <div class="no-results-content">
          <div class="no-results-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <h3>Nenhuma sala encontrada</h3>
          <p>Não encontramos salas com "{{ searchQuery }}"</p>
          <button @click="clearSearch" class="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Limpar busca
          </button>
        </div>
      </div>
      
      <div class="rooms-grid" v-else-if="filteredRooms.length > 0">
        <div 
          v-for="room in filteredRooms" 
          :key="room.id"
          :class="['room-card', { 'selected': selectedRoom?.id === room.id }]"
          @click="selectRoom(room)"
        >
          <div class="room-header">
            <div class="room-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </div>
            <div class="room-info">
              <h3>{{ room.nome }}</h3>
              <span :class="['status-badge', getStatusClass(room.data_expiracao)]">
                {{ getStatusText(room.data_expiracao) }}
              </span>
            </div>
          </div>
          
          <div class="room-content">
            <p class="room-description">
              {{ room.descricao || 'Sem descrição disponível' }}
            </p>
            <div class="room-meta">
              <div class="meta-item" v-if="room.capacidade">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Capacidade: {{ room.capacidade }} alunos</span>
              </div>
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Tipo: {{ getRoomTypeLabel(room.tipo) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </div>
        <h3>Nenhuma sala disponível</h3>
        <p>Não há salas disponíveis no momento. Crie uma nova sala para começar.</p>
        <button @click="goToCreateRoom" class="btn btn-primary">Criar Nova Sala</button>
      </div>
      
      <div class="modal-actions" v-if="rooms.length > 0">
        <button @click="cancelSelection" class="btn btn-secondary">
          Cancelar
        </button>
        <button 
          @click="startGameWithRoom" 
          class="btn btn-primary"
          :disabled="!selectedRoom"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          {{ selectedRoom ? 'Iniciar Jogo' : 'Selecione uma sala' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { salasService } from '../services/salasService.js';
import { userRoomService } from '../services/userRoomService.js';

export default {
  name: 'RoomSelection',
  props: {
    showRoomSelection: {
      type: Boolean,
      default: false
    }
  },
  emits: ['room-selected', 'cancelled'],
  
  data() {
    return {
      rooms: [],
      selectedRoom: null,
      loading: false,
      error: null,
      searchQuery: ''
    };
  },
  
  watch: {
    showRoomSelection(newVal) {
      if (newVal) {
        this.fetchRooms();
      }
    }
  },
  
  computed: {
    filteredRooms() {
      if (!this.searchQuery.trim()) {
        return this.rooms;
      }
      
      const query = this.searchQuery.toLowerCase().trim();
      return this.rooms.filter(room => 
        room.nome.toLowerCase().includes(query) ||
        (room.descricao && room.descricao.toLowerCase().includes(query))
      );
    }
  },
  
  mounted() {
    // Pre-fetch rooms when component is mounted
    this.fetchRooms();
  },
  
  methods: {
    async fetchRooms() {
      this.loading = true;
      this.error = null;
      
      try {
        console.log('Fetching user rooms...');
        const userRooms = await userRoomService.getUserRooms();
        console.log('User rooms fetched:', userRooms);
        
        // Extract room data from user rooms (userRooms contains the association + room data)
        this.rooms = userRooms.map(userRoom => userRoom.salas).filter(room => room !== null);
        console.log('Available rooms:', this.rooms);
        
        if (this.rooms.length === 0) {
          console.log('No user rooms found');
        }
      } catch (error) {
        console.error('Error fetching user rooms:', error);
        this.error = error.message || 'Não foi possível carregar suas salas';
      } finally {
        this.loading = false;
      }
    },
    
    isRoomAvailable(room) {
      console.log('Checking room availability for:', room);
      
      // Check if room is not expired
      if (room.data_expiracao) {
        const expiryDate = new Date(room.data_expiracao);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        console.log('Room expiry date:', expiryDate);
        console.log('Today date:', today);
        console.log('Is expired?', expiryDate < today);
        
        return expiryDate >= today;
      }
      
      console.log('No expiry date, room is available');
      return true;
    },
    
    selectRoom(room) {
      this.selectedRoom = room;
    },
    
    clearSearch() {
      this.searchQuery = '';
    },
    
    startGameWithRoom() {
      if (this.selectedRoom) {
        this.$emit('room-selected', this.selectedRoom);
      }
    },
    
    cancelSelection() {
      this.selectedRoom = null;
      this.$emit('cancelled');
    },
    
    goToCreateRoom() {
      this.$router.push('/salas/criar');
    },
    
    getStatusText(dataExpiracao) {
      if (!dataExpiracao) return "Sem expiração";
      
      const hoje = new Date();
      const expiracao = new Date(dataExpiracao);
      const diasRestantes = Math.ceil((expiracao - hoje) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes < 0) return "Expirada";
      if (diasRestantes === 0) return "Expira hoje";
      if (diasRestantes <= 7) return `Expira em ${diasRestantes} dias`;
      return "Ativa";
    },
    
    getStatusClass(dataExpiracao) {
      if (!dataExpiracao) return "permanent";
      
      const hoje = new Date();
      const expiracao = new Date(dataExpiracao);
      const diasRestantes = Math.ceil((expiracao - hoje) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes < 0) return "expired";
      if (diasRestantes <= 3) return "warning";
      return "active";
    },
    
    getRoomTypeLabel(tipo) {
      const tipos = {
        aula: "Aula Regular",
        estudo: "Sala de Estudo",
        prova: "Sala de Prova",
        tutoria: "Tutoria"
      };
      return tipos[tipo] || "Outro";
    }
  }
};
</script>

<style scoped>
.room-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.room-selection-modal {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
}

.modal-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1f2937;
}

.modal-header p {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 16px;
}

.instruction {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

/* Search Styles */
.search-container {
  margin-top: 16px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  background: white;
  transition: all 0.2s;
  outline: none;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.search-results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.results-count {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

/* No Search Results */
.no-search-results {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 32px;
}

.no-results-content {
  text-align: center;
}

.no-results-icon {
  color: #d1d5db;
  margin-bottom: 24px;
}

.no-results-content h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #1f2937;
  font-weight: 600;
}

.no-results-content p {
  margin: 0 0 24px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  color: #6b7280;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.error-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #dc2626;
}

.error-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
}

/* Rooms Grid */
.rooms-grid {
  padding: 24px 32px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.room-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.room-card:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.room-card.selected {
  border-color: #2563eb;
  background: linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%);
}

.room-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.room-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.room-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.warning {
  background: #fff3cd;
  color: #856404;
}

.status-badge.expired {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.permanent {
  background: #e3f2fd;
  color: #1565c0;
}

.room-description {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

.room-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 12px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #1f2937;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 32px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Responsive Design */
@media (max-width: 768px) {
  .room-selection-overlay {
    padding: 16px;
  }
  
  .room-selection-modal {
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 20px 24px;
  }
  
  .rooms-grid {
    padding: 20px 24px;
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
    padding: 20px 24px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
