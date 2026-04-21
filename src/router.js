// router.js
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/GameView.vue";
import SalasView from "@/views/SalasView.vue";
import SalaForm from "@/views/SalaForm.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: SalasView, meta: { requiresAuth: false } },
    { path: "/salas", redirect: "/" },
    { path: "/salas/criar", component: SalaForm, meta: { requiresAuth: false } },
    { path: "/salas/editar/:id", component: SalaForm, meta: { requiresAuth: false } },
    { path: "/sala/:id", component: HomeView, meta: { requiresAuth: false } },
    { path: "/jogo", component: HomeView, meta: { requiresAuth: false } },
    { path: "/jogo/:salaId", component: HomeView, meta: { requiresAuth: false } },
  ],
});

export default router;
