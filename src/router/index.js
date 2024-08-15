// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes'; // O si estás usando rutas manuales, configúralas aquí

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../components/HelloWorld.vue'),
    },
    {
      path: '/profile',
      name: 'UserProfile',
      component: () => import('../components/UserProfile.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (to.meta.requiresAuth && !user) {
    next('/');
  } else {
    next();
  }
});

export default router;
