<template>
  <header class="header">
    <h1 class="menu-title">MATEMATICANDO</h1>
    <nav class="menu">
      <ul>
        <li v-for="(item, index) in menuItems" :key="index">
          <router-link :to="item.link">
            {{ item.label }}
          </router-link>
        </li>
      </ul>
    </nav>
  </header>
  <main class="painel">
    <router-view />
  </main>
  <footer class="footer"></footer>
</template>

<script setup>
import { useAuth0 } from "@auth0/auth0-vue";
import { ref, computed, onMounted, onUnmounted, watchEffect } from "vue";

const menuItems = [
  { label: "Home", link: "/" },
  { label: "Salas", link: "/salas" },
];

const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
const logged = computed(() => isAuthenticated.value);
const permanent = ref(false);
const buttonLoginText = ref("Login");

const resizeHandler = () => {
  if (window.innerWidth < 960) {
    permanent.value = false;
  } else {
    permanent.value = true;
  }
};

watchEffect(() => {
  buttonLoginText.value = logged.value ? "Sair" : "Entrar";
});

const toggleLogin = () => {
  if (logged.value) {
    logout({ logoutParams: { returnTo: window.location.origin } });
  } else {
    loginWithRedirect();
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
