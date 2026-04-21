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
import { ref, onMounted, onUnmounted } from "vue";

const menuItems = [
  { label: "Salas", link: "/" },
  { label: "Jogo", link: "/jogo" },
];

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
