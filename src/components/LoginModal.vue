<template>
  <div class="login-overlay" v-if="showModal">
    <div class="login-modal">
      <div class="modal-header">
        <h2>{{ isLogin ? 'Login' : 'Cadastro' }}</h2>
        <button @click.stop="closeModal" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group" v-if="!isLogin">
            <label for="name">Nome Completo</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              placeholder="Digite seu nome completo"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="formData.email"
              @blur="checkEmailAvailability"
              type="email"
              required
              placeholder="Digite seu email"
              class="form-input"
              :class="{ 'input-error': emailError }"
            />
            <div class="error-message small" v-if="emailError">
              {{ emailError }}
            </div>
            <div class="checking-message" v-if="checkingEmail">
              Verificando email...
            </div>
          </div>

          
          <div class="form-group">
            <label for="password">Senha</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              placeholder="Digite sua senha"
              class="form-input"
            />
          </div>

          <div class="form-group" v-if="!isLogin">
            <label for="confirmPassword">Confirmar Senha</label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              required
              placeholder="Confirme sua senha"
              class="form-input"
            />
          </div>

          <div class="form-group lgpd-consent" v-if="!isLogin">
            <div class="consent-checkbox">
              <input
                id="lgpd-consent"
                v-model="formData.lgpdConsent"
                type="checkbox"
                required
                class="checkbox-input"
              />
              <label for="lgpd-consent" class="consent-label">
                <span class="consent-title">Concordo com o uso de meus dados</span>
                <span class="consent-text">
                 Concordo em usar meu e-mail para criar minha conta, salvar meu progresso no jogo e permitir a recuperação de senha.
                </span>
              </label>
            </div>
          </div>

          <div class="error-message" v-if="error">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar') }}
          </button>
        </form>

        <div class="toggle-mode">
          <span>{{ isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?' }}</span>
          <button @click="toggleMode" class="link-btn">
            {{ isLogin ? 'Cadastre-se' : 'Faça login' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import { authService } from '@/services/authService.js';
import { validateEmail, validatePassword, validateName } from '@/utils/validation.js';

// Props
const props = defineProps({
  showModal: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['close', 'login-success']);

// Data
const isLogin = ref(true);
const loading = ref(false);
const error = ref(null);
const formData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  lgpdConsent: false
});

const emailError = ref('');
const checkingEmail = ref(false);

// Methods
const closeModal = () => {
  emit('cancelled');
  resetForm();
};

// Check email availability
const checkEmailAvailability = async () => {
  if (!formData.email || !formData.email.includes('@') || isLogin.value) {
    emailError.value = '';
    return;
  }

  checkingEmail.value = true;
  emailError.value = '';

  try {
    const exists = await authService.checkEmailExists(formData.email);
    if (exists) {
      emailError.value = 'Este email já está cadastrado';
    }
  } catch (error) {
    console.error('Error checking email:', error);
  } finally {
    checkingEmail.value = false;
  }
};

const resetForm = () => {
  formData.name = '';
  formData.email = '';
  formData.password = '';
  formData.confirmPassword = '';
  formData.lgpdConsent = false;
  error.value = null;
  loading.value = false;
};

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  resetForm();
};

const validateForm = () => {
  // Validate email for both login and registration
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    error.value = emailValidation.error || 'Por favor, insira um email válido';
    return false;
  }

  // Check if email is already taken (only for registration)
  if (!isLogin.value && emailError.value) {
    error.value = emailError.value;
    return false;
  }

  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    error.value = passwordValidation.error || 'Senha inválida';
    return false;
  }

  // Additional validations for registration
  if (!isLogin.value) {
    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      error.value = nameValidation.error || 'Nome inválido';
      return false;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      error.value = 'As senhas não coincidem';
      return false;
    }

    // Validate LGPD consent
    if (!formData.lgpdConsent) {
      error.value = 'É necessário concordar com o uso de seus dados para se cadastrar';
      return false;
    }
  }

  return true;
};

const handleSubmit = async () => {
  // Prevent multiple submissions
  if (loading.value) {
    console.log('Login already processing, ignoring...');
    return;
  }

  if (!validateForm()) return;

  loading.value = true;
  error.value = null;

  try {
    
    let result;
    
    if (isLogin.value) {
      // Login - apenas autentica usuário existente
      result = await authService.loginUser(formData.email, formData.password);
    } else {
      // Register - cria novo usuário
      result = await authService.registerUser(formData.name, formData.email, formData.password);
    }
    emit('login-success', result.user);
    closeModal();
  } catch (err) {
    console.error('LoginModal: Authentication error:', err);
    error.value = err.message || 'Ocorreu um erro. Tente novamente.';
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
/* Login Overlay */
.login-overlay {
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
}

/* Login Modal */
.login-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.input-error {
  border-color: #dc2626;
}

.form-input.input-error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message.small {
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 0;
  padding: 4px 8px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.checking-message {
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 0;
  color: #6b7280;
  font-style: italic;
}

.form-input::placeholder {
  color: #9ca3af;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  border: 1px solid #fecaca;
}

.btn {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toggle-mode {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-weight: 500;
  text-decoration: underline;
  margin-left: 4px;
  transition: color 0.2s;
}

.link-btn:hover {
  color: #5a67d8;
}

/* LGPD Consent Styles */
.lgpd-consent {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
}

.consent-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.checkbox-input {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
  cursor: pointer;
}

.consent-label {
  flex: 1;
  cursor: pointer;
  line-height: 1.5;
}

.consent-title {
  display: block;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 14px;
}

.consent-text {
  display: block;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
}

.consent-text br {
  display: block;
  margin: 2px 0;
}

/* Responsive Design */
@media (max-width: 480px) {
  .login-modal {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header {
    padding: 20px 20px 0;
  }
  
  .modal-body {
    padding: 20px;
  }
}
</style>
