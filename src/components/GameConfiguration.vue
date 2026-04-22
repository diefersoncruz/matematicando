<template>
  <div class="game-configuration">
    <label class="form-label">Configurações do Jogo</label>
    <div class="config-section">
      <div class="config-row">
        <div class="config-item">
          <label for="limiteTempo" class="config-label">Tempo Limite (segundos)</label>
          <input 
            type="number" 
            id="limiteTempo" 
            v-model="localConfig.limiteTempo"
            class="config-input"
            min="10"
            max="300"
            @input="updateConfig"
          />
        </div>
        <div class="config-item">
          <label for="limiteFatorA" class="config-label">Limite Fator A</label>
          <input 
            type="number" 
            id="limiteFatorA" 
            v-model="localConfig.limiteFatorA"
            class="config-input"
            min="1"
            max="1000"
            @input="updateConfig"
          />
        </div>
        <div class="config-item">
          <label for="limiteFatorB" class="config-label">Limite Fator B</label>
          <input 
            type="number" 
            id="limiteFatorB" 
            v-model="localConfig.limiteFatorB"
            class="config-input"
            min="1"
            max="1000"
            @input="updateConfig"
          />
        </div>
      </div>
      
      <div class="config-row">
        <div class="config-item">
          <label for="limiteNegativoA" class="config-label">Limite Negativo Fator A</label>
          <input 
            type="number" 
            id="limiteNegativoA" 
            v-model="localConfig.limiteNegativoFatorA"
            class="config-input"
            min="0"
            max="1000"
            @input="updateConfig"
          />
        </div>
        <div class="config-item">
          <label for="limiteNegativoB" class="config-label">Limite Negativo Fator B</label>
          <input 
            type="number" 
            id="limiteNegativoB" 
            v-model="localConfig.limiteNegativoFatorB"
            class="config-input"
            min="0"
            max="1000"
            @input="updateConfig"
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
                v-model="localConfig.operacoesDeAdicao"
                @change="updateConfig"
              />
              <span>Adição (+)</span>
            </label>
            <label class="operation-checkbox">
              <input 
                type="checkbox" 
                v-model="localConfig.operacoesDeSubtracao"
                @change="updateConfig"
              />
              <span>Subtração (-)</span>
            </label>
            <label class="operation-checkbox">
              <input 
                type="checkbox" 
                v-model="localConfig.operacoesDeMultiplicacao"
                @change="updateConfig"
              />
              <span>Multiplicação (×)</span>
            </label>
            <label class="operation-checkbox">
              <input 
                type="checkbox" 
                v-model="localConfig.operacoesDeDivisao"
                @change="updateConfig"
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
              v-model="localConfig.exibirRespostaCerta"
              @change="updateConfig"
            />
            <span>Exibir Resposta Correta</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      limiteTempo: 60,
      limiteFatorA: 10,
      limiteFatorB: 10,
      limiteNegativoFatorA: 0,
      limiteNegativoFatorB: 0,
      operacoesDeAdicao: true,
      operacoesDeSubtracao: true,
      operacoesDeMultiplicacao: false,
      operacoesDeDivisao: false,
      exibirRespostaCerta: false
    })
  }
});

const emit = defineEmits(['update:modelValue']);

const localConfig = ref({ ...props.modelValue });

const updateConfig = () => {
  emit('update:modelValue', { ...localConfig.value });
};

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localConfig.value = { ...newValue };
}, { deep: true });

// Initialize on mount
onMounted(() => {
  localConfig.value = { ...props.modelValue };
});
</script>

<style scoped>
.game-configuration {
  width: 100%;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #374151;
  font-size: 16px;
  margin-bottom: 8px;
}

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
  border-radius: 6px;
  transition: background-color 0.2s;
}

.operation-checkbox:hover {
  background: #f3f4f6;
}

.operation-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

/* Responsive */
@media (max-width: 768px) {
  .config-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .operations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
