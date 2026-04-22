<template>
  <div class="user-profile">
    <div class="user-info" v-if="currentUser">
      <div class="user-avatar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div class="user-details">
        <span class="username">{{ currentUser.username }}</span>
        <span class="user-status">Online</span>
      </div>
    </div>
    
    <button @click="showLoginModal" class="login-btn" v-else>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      Entrar
    </button>

    <div class="user-menu" v-if="currentUser">
      <button @click="logout" class="logout-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sair
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authService } from '@/services/authService.js';

// Emits
const emit = defineEmits(['show-login', 'logout-success']);

// Data
const currentUser = ref(null);

// Methods
const showLoginModal = () => {
  emit('show-login');
};

const logout = async () => {
  try {
    await authService.logout();
    currentUser.value = null;
    // Emit event to parent components to handle logout
    emit('logout-success');
  } catch (error) {
      }
};

const loadCurrentUser = () => {
  currentUser.value = authService.getCurrentUser();
  };

const updateUser = () => {
  loadCurrentUser();
};

// Expose method for parent components to call
defineExpose({
  updateUser
});

// Lifecycle
onMounted(() => {
  loadCurrentUser();
});
</script>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.user-status {
  font-size: 12px;
  color: #059669;
  font-weight: 500;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-menu {
  display: flex;
  align-items: center;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

/* Responsive Design */
@media (max-width: 768px) {
  .user-details {
    display: none;
  }
  
  .username {
    font-size: 12px;
  }
}
</style>
