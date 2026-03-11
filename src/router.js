// router.js
import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/GameView.vue";
import SalasView from "@/views/SalaForm.vue";
import { useAuth0 } from "@auth0/auth0-vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomeView, meta: { requiresAuth: true } },
    { path: "/salas", component: SalasView, meta: { requiresAuth: true } },
  ],
});

router.beforeResolve(async (to, from, next) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading.value) {
    // Espera um pouco para evitar loops intensos
    await new Promise((resolve) => setTimeout(resolve, 200));
    return next(false); // Interrompe temporariamente a navegação
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    await loginWithRedirect({ appState: { targetUrl: to.fullPath } });
    // A navegação será interrompida aqui devido ao redirecionamento.
  } else {
    next();
  }
});

export default router;
