import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';

const routes = [
  { path: '/',              name: 'Home',      component: () => import('../views/Home.vue') },
  { path: '/login',         name: 'Login',     component: () => import('../views/Login.vue') },
  { path: '/trade/:token?', name: 'Trading',   component: () => import('../views/Trading.vue') },
  { path: '/discover',      name: 'Discover',  component: () => import('../views/Discover.vue') },
  { path: '/portfolio',     name: 'Portfolio', component: () => import('../views/Portfolio.vue') },
  { path: '/analytics',     name: 'Analytics', component: () => import('../views/Analytics.vue') },
  { path: '/launchpad',     name: 'Launchpad', component: () => import('../views/Launchpad.vue') },
  { path: '/alerts',        name: 'Alerts',    component: () => import('../views/Alerts.vue'), meta: { requiresAuth: true } },
  { path: '/token/:mint',   name: 'Token',     component: () => import('../views/Token.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !store.getters.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
});

export default router;
