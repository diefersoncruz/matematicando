<template>
  <div id="app">
    <header class="app-header">
      <nav class="nav-menu">
        <router-link to="/" class="nav-link">Salas</router-link>
        <router-link to="/minhas-salas" class="nav-link">Minhas Salas</router-link>
        <router-link to="/jogo" class="nav-link">Jogo</router-link>
      </nav>
      
      <UserProfile ref="userProfileRef" @show-login="showLoginModal = true" @logout-success="handleLogoutSuccess" />
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>&copy; 2024 Matematicando - Aprenda Matemática Divertidamente</p>
    </footer>
    
    <LoginModal 
      :showModal="showLoginModal" 
      @close="() => { console.log('DEBUG: Evento close recebido no App'); showLoginModal = false; }"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import UserProfile from './components/UserProfile.vue'
import LoginModal from './components/LoginModal.vue'

const showLoginModal = ref(false);
const userProfileRef = ref(null);

const handleLoginSuccess = () => {
  // Update UserProfile to reflect logged-in state
  if (userProfileRef.value) {
    userProfileRef.value.updateUser();
  }
  showLoginModal.value = false;
}

const handleLogoutSuccess = () => {
  // Update UserProfile to reflect logged-out state
  if (userProfileRef.value) {
    userProfileRef.value.updateUser();
  }
  console.log('App: User logged out successfully');
};

const permanent = ref(false);

const resizeHandler = () => {
  if (window.innerWidth < 960) {
    permanent.value = false;
  } else {
    permanent.value = true;
  }
};

onMounted(() => {
  window.addEventListener("resize", resizeHandler);
  resizeHandler();
});
onUnmounted(() => {
  window.removeEventListener("resize", resizeHandler);
});
</script>
