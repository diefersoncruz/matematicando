<template>
  <div class="sala-form-overlay" v-if="showModal">
    <div class="sala-form-modal">
      <button @click="closeModal" class="close-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      
      <div class="sala-form-container">
        <div class="form-header">
          <div class="header-content">
            <h1>Criar Nova Sala</h1>
            <p class="form-description">
              Preencha as informações abaixo para criar uma nova sala de matemática.
            </p>
          </div>
          <div class="header-icon">
            <div class="icon-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </div>
          </div>
        </div>

        <form @submit.prevent="submitForm" class="modern-form">
          <div class="form-row">
            <div class="form-group full-width">
              <label for="nomeSala" class="form-label">
                Nome da Sala <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="nomeSala" 
                  v-model="sala.nome" 
                  :class="['form-input', { 'error': errors.nome }]"
                  placeholder="Ex: Matemática Básica, Geometria, Cálculo..."
                  required 
                  @input="clearError('nome')"
                />
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12h18m-9-9v18"/>
                  </svg>
                </div>
              </div>
              <span class="error-message" v-if="errors.nome">{{ errors.nome }}</span>
              <span class="help-text">Escolha um nome claro e descritivo para a sala.</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="descricao" class="form-label">
                Descrição
              </label>
              <div class="input-wrapper">
                <textarea 
                  id="descricao" 
                  v-model="sala.descricao" 
                  class="form-input textarea"
                  placeholder="Descreva o conteúdo e objetivos desta sala..."
                  rows="3"
                  @input="clearError('descricao')"
                ></textarea>
              </div>
              <span class="help-text">Uma breve descrição ajuda os alunos a entenderem o conteúdo da sala.</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dataExpiracao" class="form-label">
                Data de Expiração
              </label>
              <div class="input-wrapper">
                <input 
                  type="date" 
                  id="dataExpiracao" 
                  v-model="sala.dataExpiracao" 
                  class="form-input"
                  :min="minDate"
                />
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              </div>
              <span class="help-text">Opcional. A sala ficará disponível até esta data.</span>
            </div>

            <div class="form-group">
              <label for="capacidade" class="form-label">
                Capacidade Máxima
              </label>
              <div class="input-wrapper">
                <input 
                  type="number" 
                  id="capacidade" 
                  v-model="sala.capacidade" 
                  class="form-input"
                  placeholder="50"
                  min="1"
                  max="200"
                />
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
              </div>
              <span class="help-text">Número máximo de alunos permitidos.</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label">
                Tipo de Sala
              </label>
              <div class="radio-group">
                <label class="radio-option" v-for="tipo in tiposSala" :key="tipo.value">
                  <input 
                    type="radio" 
                    :value="tipo.value" 
                    v-model="sala.tipo"
                    class="radio-input"
                  />
                  <div class="radio-custom"></div>
                  <div class="radio-content">
                    <span class="radio-title">{{ tipo.label }}</span>
                    <span class="radio-description">{{ tipo.description }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Configuration Section -->
          <div class="form-row">
            <div class="form-group full-width">
              <GameConfiguration 
                v-model="gameConfig"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancelar
            </button>
            <button type="submit" :disabled="submitting" class="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-if="!submitting">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <div class="spinner" v-else></div>
              {{ submitting ? 'Criando...' : 'Criar Sala' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { salasService } from '../services/salasService.js';
import { configService } from '../services/configService.js';
import { authService } from '@/services/authService.js';
import { userRoomService } from '@/services/userRoomService.js';
import GameConfiguration from '@/components/GameConfiguration.vue';

// Props
const props = defineProps({
  showModal: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['sala-created', 'cancelled']);

// Data
const submitting = ref(false);
const sala = ref({
  nome: "",
  descricao: "",
  dataExpiracao: "",
  capacidade: "",
  tipo: "aula"
});

const gameConfig = ref({
  limiteTempo: 60,
  limiteFatorA: 10,
  limiteFatorB: 10,
  limiteNegativoFatorA: 0,
  limiteNegativoFatorB: 0,
  operacoesDeAdicao: true,
  operacoesDeSubtracao: true,
  operacoesDeMultiplicacao: true,
  operacoesDeDivisao: true,
  exibirRespostaCerta: false
});
const errors = ref({
  nome: null,
  descricao: null
});

const tiposSala = ref([
  {
    value: "aula",
    label: "Aula Regular",
    description: "Sala para aulas tradicionais com acompanhamento do professor"
  },
  {
    value: "estudo",
    label: "Sala de Estudo",
    description: "Espaço para estudo individual ou em grupo"
  },
  {
    value: "prova",
    label: "Sala de Prova",
    description: "Ambiente controlado para realização de avaliações"
  },
  {
    value: "tutoria",
    label: "Tutoria",
    description: "Sessões de apoio e esclarecimento de dúvidas"
  }
]);

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// Methods
const closeModal = () => {
  emit('cancelled');
  resetForm();
};

const resetForm = () => {
  sala.value = {
    nome: "",
    descricao: "",
    dataExpiracao: "",
    capacidade: "",
    tipo: "aula"
  };
  errors.value = {
    nome: null,
    descricao: null
  };
  submitting.value = false;
};

const clearError = (field) => {
  if (errors.value[field]) {
    errors.value[field] = null;
  }
};

const validateForm = () => {
  errors.value = { nome: null, descricao: null };
  
  if (!sala.value.nome.trim()) {
    errors.value.nome = "O nome da sala é obrigatório";
    return false;
  }
  
  return true;
};

const submitForm = async () => {
  // Prevent multiple submissions
  if (submitting.value) {
    console.log('Form already submitting, ignoring...');
    return;
  }

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    alert('Você precisa estar logado para criar uma sala. Por favor, faça login primeiro.');
    closeModal();
    return;
  }

  if (!validateForm()) return;
  
  submitting.value = true;
  
  try {
    console.log('=== SalaFormModal Debug ===');
    console.log('Sala data:', sala.value);
    console.log('Game config:', gameConfig.value);
    
    // Create the room (without game config)
    const createdSala = await salasService.createSala(sala.value);
    console.log('Room created successfully:', createdSala);
    
    // Save game configuration separately
    if (createdSala && createdSala.id) {
      console.log('Saving game configuration for sala:', createdSala.id);
      await configService.saveRoomConfig(createdSala.id, gameConfig.value);
      console.log('Game configuration saved successfully');
    }
    
    // Get current user
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Join the room as admin (all users are admins)
      await userRoomService.joinRoom(createdSala.id);
      console.log('User joined room as admin');
    }
    
    emit('sala-created', createdSala);
    closeModal();
  } catch (error) {
    console.error('Error creating room:', error);
    alert('Erro ao criar sala: ' + error.message);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
/* Modal Overlay */
.sala-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

/* Modal */
.sala-form-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: #374151;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 1);
  color: #1f2937;
}

/* Original SalaForm Styles */
.sala-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 32px 24px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  margin: -20px -20px 32px;
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.form-description {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
  line-height: 1.5;
}

.header-icon .icon-wrapper {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-form {
  padding: 0 32px 32px;
}

.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  flex: 1;
}

.form-group.full-width {
  width: 100%;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.required {
  color: #ef4444;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
  background: #fff;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input::placeholder {
  color: #9ca3af;
}

.textarea {
  resize: vertical;
  min-height: 80px;
  padding-top: 12px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.textarea + .input-icon {
  top: 20px;
  transform: none;
}

.error-message {
  display: block;
  margin-top: 4px;
  color: #ef4444;
  font-size: 14px;
}

.help-text {
  display: block;
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #2563eb;
  background: #f9fafb;
}

.radio-option input:checked + .radio-custom + .radio-content {
  color: #2563eb;
}

.radio-option input:checked + .radio-custom {
  border-color: #2563eb;
  background: #2563eb;
}

.radio-option input:checked + .radio-custom::after {
  opacity: 1;
}

.radio-input {
  position: absolute;
  opacity: 0;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  margin-right: 12px;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 2px;
}

.radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

.radio-content {
  flex: 1;
}

.radio-title {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.radio-description {
  display: block;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
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
  min-width: 140px;
  justify-content: center;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
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

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Configuration Section Styles */
.config-section {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 8px;
}

.config-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-item {
  flex: 1;
}

.config-item.full-width {
  flex: 1;
}

.config-label {
  display: block;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
  margin-bottom: 6px;
}

.config-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  background: #fff;
}

.config-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.operations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.operation-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.operation-checkbox:hover {
  border-color: #2563eb;
  background: #f8fafc;
}

.operation-checkbox input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
}

@media (max-width: 768px) {
  .sala-form-overlay {
    padding: 10px;
  }
  
  .sala-form-modal {
    margin: 10px;
    padding: 16px;
    border-radius: 12px;
  }
  
  .form-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 24px 16px 20px;
    margin: -16px -16px 24px;
  }
  
  .modern-form {
    padding: 0 16px 16px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .config-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .operations-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
