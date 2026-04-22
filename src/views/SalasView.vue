<template>
  <div class="salas-view">
    <!-- Modern Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1>Salas de Matemática</h1>
          <p class="header-description">
            Gerencie e organize suas salas de estudo matemático
          </p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-number">{{ salas.length }}</div>
            <div class="stat-label">Salas Ativas</div>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button @click="criarNovaSala" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Nova Sala
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Carregando salas...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-content">
        <div class="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2>Erro ao carregar salas</h2>
        <p>{{ error }}</p>
        <button @click="fetchSalas" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Tentar Novamente
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!salas || salas.length === 0" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </div>
        <h2>Nenhuma sala encontrada</h2>
        <p>Comece criando sua primeira sala de matemática para organizar seus estudos.</p>
        <button @click="criarNovaSala" class="btn btn-primary btn-large">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar Primeira Sala
        </button>
      </div>
    </div>

    <!-- Salas Grid -->
    <div v-else class="salas-container">
      <div class="salas-grid">
        <div 
          v-for="sala in salas.filter(s => s && s.nome)" 
          :key="sala.id || Math.random()" 
          class="sala-card"
          @click="viewSala(sala)"
        >
          <div class="card-header">
            <div class="sala-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </div>
            <div class="sala-info">
              <h3>{{ sala.nome }}</h3>
              <span :class="['status-badge', getStatusClass(sala.dataExpiracao)]">
                {{ getStatusText(sala.dataExpiracao) }}
              </span>
            </div>
          </div>

          <div class="card-content">
            <p class="sala-description">
              {{ sala.descricao || 'Sem descrição disponível para esta sala.' }}
            </p>
            
            <div class="sala-meta">
              <div class="meta-row">
                <div class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Criada em {{ formatarData(sala.dataCriacao) }}</span>
                </div>
                <div class="meta-item" v-if="sala.dataExpiracao">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Expira em {{ formatarData(sala.dataExpiracao) }}</span>
                </div>
              </div>
              
              <div class="meta-row" v-if="sala.capacidade">
                <div class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>Capacidade: {{ sala.capacidade }} alunos</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="sala-type" v-if="sala.tipo">
              <span class="type-badge">{{ getSalaTypeLabel(sala.tipo) }}</span>
            </div>
            <div class="card-actions">
              <button class="action-btn" @click.stop="viewSala(sala)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Ver
              </button>
              <button class="action-btn btn-play" @click.stop="playInRoom(sala)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Jogar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { salasService } from '@/services/salasService.js';

export default {
  name: "SalasView",
  
  data() {
    return {
      salas: [],
      loading: false,
      error: null,
      userId: 1,
    };
  },

  mounted() {
    this.fetchSalas();
  },

  methods: {
    async fetchSalas() {
      this.loading = true;
      this.error = null;
      
      try {
        const salas = await salasService.getAllSalas();
        this.salas = salas.map(sala => ({
          ...sala,
          dataCriacao: sala.created_at,
          dataExpiracao: sala.data_expiracao
        }));
      } catch (error) {
        console.error('Error fetching salas:', error);
        this.error = error.message || 'Não foi possível carregar as salas';
      } finally {
        this.loading = false;
      }
    },

    criarNovaSala() {
      // Check if user is authenticated
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('Você precisa estar logado para criar uma sala. Por favor, faça login primeiro.');
        return;
      }
      this.$router.push("/salas/criar");
    },
    
    viewSala(sala) {
      this.$router.push(`/sala/${sala.id}/ranking`);
    },
    
    playInRoom(sala) {
      // Store the selected room and navigate to game
      localStorage.setItem('currentRoom', JSON.stringify(sala));
      this.$router.push('/jogo');
    },
    
    formatarData(data) {
      if (!data) return "Data não definida";
      const dataFormatada = new Date(data);
      return dataFormatada.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
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
    
    getSalaTypeLabel(tipo) {
      const tipos = {
        aula: "Aula Regular",
        estudo: "Sala de Estudo",
        prova: "Sala de Prova",
        tutoria: "Tutoria"
      };
      return tipos[tipo] || "Outro";
    }
  },
};
</script>

<style scoped>
.salas-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

/* Modern Header */
.page-header {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
}

.header-text h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-description {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
  line-height: 1.5;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  text-align: center;
  min-width: 120px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Buttons */
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
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
}

/* Loading State */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  text-align: center;
  color: #6b7280;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-content {
  text-align: center;
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  max-width: 480px;
  border: 2px solid #fecaca;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 24px;
}

.error-content h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #dc2626;
}

.error-content p {
  margin: 0 0 32px 0;
  color: #6b7280;
  line-height: 1.6;
}

/* Empty State */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-content {
  text-align: center;
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  max-width: 480px;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 24px;
}

.empty-content h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #1f2937;
}

.empty-content p {
  margin: 0 0 32px 0;
  color: #6b7280;
  line-height: 1.6;
}

/* Salas Container */
.salas-container {
  max-width: 1200px;
  margin: 0 auto;
}

.salas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

/* Modern Sala Cards */
.sala-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.sala-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.sala-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.sala-info {
  flex: 1;
}

.sala-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.card-content {
  padding: 16px 24px;
}

.sala-description {
  margin: 0 0 16px 0;
  color: #6b7280;
  line-height: 1.5;
  font-size: 14px;
}

.sala-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 13px;
}

.meta-item svg {
  flex-shrink: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.sala-type {
  display: flex;
  align-items: center;
}

.type-badge {
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.action-btn.btn-play {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.action-btn.btn-play:hover {
  background: #059669;
  border-color: #059669;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .salas-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .salas-view {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 24px;
    padding: 24px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 24px;
  }
  
  .header-text h1 {
    font-size: 28px;
  }
  
  .header-stats {
    justify-content: center;
  }
  
  .salas-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    padding: 20px;
  }
  
  .card-content {
    padding: 16px 20px;
  }
  
  .card-footer {
    padding: 16px 20px;
  }
  
  .empty-content {
    padding: 32px 24px;
    margin: 16px;
  }
}

@media (max-width: 480px) {
  .header-text h1 {
    font-size: 24px;
  }
  
  .stat-card {
    min-width: 100px;
    padding: 12px 16px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .sala-card {
    border-radius: 12px;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .sala-icon {
    width: 40px;
    height: 40px;
  }
  
  .sala-info h3 {
    font-size: 18px;
  }
}
</style>
