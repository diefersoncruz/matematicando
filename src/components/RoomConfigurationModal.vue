<template>
  <div class="config-modal-overlay" v-if="showModal">
    <div class="config-modal">
      <button @click="closeModal" class="close-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      
      <div class="config-modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Configurações' : 'Configurar Sala' }}</h2>
          <p class="modal-subtitle">{{ room?.nome || 'Sala' }}</p>
        </div>

        <form @submit.prevent="saveConfiguration" class="config-form">
          <div class="config-section">
            <h3>Configurações do Jogo</h3>
            
            <div class="config-row">
              <div class="config-item">
                <label for="limiteTempo" class="config-label">Tempo Limite (segundos)</label>
                <input 
                  type="number" 
                  id="limiteTempo" 
                  v-model="configuracao.limiteTempo"
                  class="config-input"
                  min="10"
                  max="300"
                  required
                />
              </div>
              <div class="config-item">
                <label for="limiteFatorA" class="config-label">Limite Fator A</label>
                <input 
                  type="number" 
                  id="limiteFatorA" 
                  v-model="configuracao.limiteFatorA"
                  class="config-input"
                  min="1"
                  max="1000"
                  required
                />
              </div>
              <div class="config-item">
                <label for="limiteFatorB" class="config-label">Limite Fator B</label>
                <input 
                  type="number" 
                  id="limiteFatorB" 
                  v-model="configuracao.limiteFatorB"
                  class="config-input"
                  min="1"
                  max="1000"
                  required
                />
              </div>
            </div>
            
            <div class="config-row">
              <div class="config-item">
                <label for="limiteNegativoA" class="config-label">Limite Negativo Fator A</label>
                <input 
                  type="number" 
                  id="limiteNegativoA" 
                  v-model="configuracao.limiteNegativoFatorA"
                  class="config-input"
                  min="0"
                  max="1000"
                />
              </div>
              <div class="config-item">
                <label for="limiteNegativoB" class="config-label">Limite Negativo Fator B</label>
                <input 
                  type="number" 
                  id="limiteNegativoB" 
                  v-model="configuracao.limiteNegativoFatorB"
                  class="config-input"
                  min="0"
                  max="1000"
                />
              </div>
            </div>

            <div class="config-row">
              <div class="config-item full-width">
                <label class="config-label">Operações Permitidas</label>
                <div class="operations-grid">
                  <label class="operation-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="configuracao.operacoesPermitidas.operacoesDeAdicao"
                    />
                    <span>Adição (+)</span>
                  </label>
                  <label class="operation-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="configuracao.operacoesPermitidas.operacoesDeSubtracao"
                    />
                    <span>Subtração (-)</span>
                  </label>
                  <label class="operation-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="configuracao.operacoesPermitidas.operacoesDeMultiplicacao"
                    />
                    <span>Multiplicação (×)</span>
                  </label>
                  <label class="operation-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="configuracao.operacoesPermitidas.operacoesDeDivisao"
                    />
                    <span>Divisão (÷)</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="config-row">
              <div class="config-item">
                <label class="operation-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="configuracao.exibicao.exibirRespostaCerta"
                  />
                  <span>Exibir Resposta Correta</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Salvando...' : 'Salvar Configurações' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { roomConfigurationService } from '@/services/roomConfigurationService.js';

// Props
const props = defineProps({
  showModal: {
    type: Boolean,
    default: false
  },
  room: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['close', 'saved']);

// Data
const loading = ref(false);
const configuracao = ref({
  limiteTempo: 60,
  limiteFatorA: 10,
  limiteFatorB: 10,
  limiteNegativoFatorA: 0,
  limiteNegativoFatorB: 0,
  operacoesPermitidas: {
    operacoesDeAdicao: true,
    operacoesDeSubtracao: true,
    operacoesDeMultiplicacao: true,
    operacoesDeDivisao: true
  },
  exibicao: {
    exibirRespostaCerta: false
  }
});

// Methods
const closeModal = () => {
  emit('close');
};

const loadConfiguration = async () => {
  if (!props.room) return;
  
  loading.value = true;
  try {
    const config = await roomConfigurationService.getRoomConfiguration(props.room.id);
    configuracao.value = { ...config };
  } catch (error) {
    console.error('Error loading configuration:', error);
    // Use default configuration if error
    configuracao.value = roomConfigurationService.getDefaultConfiguration();
  } finally {
    loading.value = false;
  }
};

const saveConfiguration = async () => {
  if (!props.room) return;
  
  loading.value = true;
  try {
    // Validate configuration
    const errors = roomConfigurationService.validateConfiguration(configuracao.value);
    if (errors.length > 0) {
      alert('Erros de validação:\n' + errors.join('\n'));
      return;
    }
    
    await roomConfigurationService.saveRoomConfiguration(props.room.id, configuracao.value);
    emit('saved', configuracao.value);
    closeModal();
  } catch (error) {
    console.error('Error saving configuration:', error);
    alert('Erro ao salvar configurações: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// Watch for room changes
watch(() => props.room, () => {
  if (props.room && props.showModal) {
    loadConfiguration();
  }
});

// Load configuration when modal opens
watch(() => props.showModal, (show) => {
  if (show && props.room) {
    loadConfiguration();
  }
});
</script>

<style scoped>
/* Modal Overlay */
.config-modal-overlay {
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
.config-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  max-width: 700px;
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

/* Modal Content */
.config-modal-content {
  padding: 20px;
}

.modal-header {
  text-align: center;
  margin-bottom: 30px;
}

.modal-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.modal-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
}

/* Form Styles */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.config-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
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
  border-color: #667eea;
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
  border-color: #667eea;
  background: #f8fafc;
}

.operation-checkbox input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

.btn-primary {
  background: #667eea;
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

/* Responsive Design */
@media (max-width: 768px) {
  .config-modal-overlay {
    padding: 10px;
  }
  
  .config-modal {
    margin: 10px;
    padding: 16px;
    border-radius: 12px;
  }
  
  .config-modal-content {
    padding: 16px;
  }
  
  .config-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .operations-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
