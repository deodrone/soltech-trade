<template>
  <div id="app">
    <div v-if="tokenRefreshing" class="refresh-bar" />
    <nav class="navbar">
      <div class="brand">Soltech-Trade</div>
      <router-link to="/">Home</router-link>
      <router-link to="/trading">Trading</router-link>
      <router-link to="/dashboard">Dashboard</router-link>
      <div class="nav-auth">
        <template v-if="isLoggedIn">
          <span class="user-email">{{ currentUser.email }}</span>
          <button class="logout-btn" @click="handleLogout">Logout</button>
        </template>
        <router-link v-else to="/login" class="login-link">Sign In</router-link>
      </div>
    </nav>
    <router-view />
    <ToastNotification />
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useAuth } from './composables/useAuth';
import { useToast } from './composables/useToast';
import { useRouter } from 'vue-router';
import ToastNotification from './components/ToastNotification.vue';

export default {
  name: 'App',
  components: { ToastNotification },
  setup() {
    const store = useStore();
    const router = useRouter();
    const { logout } = useAuth();
    const { show } = useToast();

    const isLoggedIn = computed(() => store.getters.isLoggedIn);
    const currentUser = computed(() => store.getters.currentUser);
    const tokenRefreshing = computed(() => store.getters.tokenRefreshing);

    const handleLogout = async () => {
      await logout();
      show({ message: 'You have been signed out.', type: 'info' });
      router.push('/login');
    };

    return { isLoggedIn, currentUser, tokenRefreshing, handleLogout };
  }
};
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; background: #0d1117; color: #e6edf3; }
.navbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
}
.navbar .brand { font-weight: bold; font-size: 1.2rem; color: #58a6ff; margin-right: auto; }
.navbar a { color: #e6edf3; text-decoration: none; }
.navbar a:hover, .navbar a.router-link-active { color: #58a6ff; }
.nav-auth { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.user-email { color: #8b949e; font-size: 0.85rem; }
.logout-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #30363d;
  color: #e6edf3;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.logout-btn:hover { border-color: #f85149; color: #f85149; }
.login-link {
  padding: 6px 14px;
  background: #238636;
  color: #fff !important;
  border-radius: 6px;
  font-size: 0.85rem;
}
.login-link:hover { background: #2ea043; }
.refresh-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #58a6ff 0%, #3fb950 50%, #58a6ff 100%);
  background-size: 200% 100%;
  animation: slide 1.2s linear infinite;
  z-index: 9999;
}
@keyframes slide {
  0%   { background-position: 200% 0; }
  100% { background-position: 0% 0; }
}
</style>
