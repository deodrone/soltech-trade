<template>
  <div id="app">
    <!-- Auth loading splash -->
    <div v-if="!authReady" class="auth-splash">
      <div class="splash-logo">Soltech Trade</div>
      <div class="splash-spinner" />
    </div>

    <template v-else>
      <div v-if="tokenRefreshing" class="refresh-bar" />
      <nav class="navbar">
        <router-link to="/" class="brand">Soltech Trade</router-link>

        <!-- Desktop nav -->
        <div class="nav-links desktop-nav">
          <router-link to="/trade">Swap</router-link>
          <router-link to="/discover">Discover</router-link>
          <router-link to="/portfolio">Portfolio</router-link>
          <router-link to="/analytics">Analytics</router-link>
          <router-link to="/launchpad">Launchpad</router-link>
          <router-link to="/alerts">Alerts</router-link>
        </div>

        <div class="nav-right">
          <premium-badge />
          <wallet-connect />
          <template v-if="isLoggedIn">
            <button class="logout-btn" @click="handleLogout" title="Sign out">↩</button>
          </template>
          <router-link v-else to="/login" class="login-link">Sign In</router-link>
          <!-- Mobile hamburger -->
          <button class="hamburger" @click="mobileOpen = !mobileOpen" aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <!-- Mobile menu -->
      <div v-if="mobileOpen" class="mobile-menu" @click="mobileOpen = false">
        <router-link to="/trade">Swap</router-link>
        <router-link to="/discover">Discover</router-link>
        <router-link to="/portfolio">Portfolio</router-link>
        <router-link to="/analytics">Analytics</router-link>
        <router-link to="/launchpad">Launchpad</router-link>
        <router-link to="/alerts">Alerts</router-link>
      </div>

      <router-view />
      <ToastNotification />
    </template>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useAuth } from './composables/useAuth';
import { useToast } from './composables/useToast';
import { useRouter } from 'vue-router';
import ToastNotification from './components/ToastNotification.vue';
import WalletConnect from './components/wallet/WalletConnect.vue';
import PremiumBadge from './components/monetization/PremiumBadge.vue';

export default {
  name: 'App',
  components: { ToastNotification, WalletConnect, PremiumBadge },
  setup() {
    const store = useStore();
    const router = useRouter();
    const { logout } = useAuth();
    const { show } = useToast();
    const mobileOpen = ref(false);

    const isLoggedIn = computed(() => store.getters.isLoggedIn);
    const authReady = computed(() => store.getters.authReady);
    const tokenRefreshing = computed(() => store.getters.tokenRefreshing);

    const handleLogout = async () => {
      await logout();
      show({ message: 'You have been signed out.', type: 'info' });
      router.push('/');
    };

    return { isLoggedIn, authReady, tokenRefreshing, mobileOpen, handleLogout };
  }
};
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #0d1117; color: #e6edf3; }

/* Auth splash */
.auth-splash { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0d1117; gap: 20px; }
.splash-logo { font-size: 1.4rem; font-weight: 800; color: #58a6ff; letter-spacing: -0.02em; }
.splash-spinner { width: 28px; height: 28px; border: 2px solid #21262d; border-top-color: #58a6ff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Navbar */
.navbar {
  display: flex; align-items: center; gap: 0;
  padding: 0 20px; height: 48px;
  background: #161b22; border-bottom: 1px solid #21262d;
  position: sticky; top: 0; z-index: 100;
}

.brand { font-weight: 700; font-size: 1rem; color: #58a6ff !important; text-decoration: none; margin-right: 24px; white-space: nowrap; letter-spacing: -0.3px; }

.nav-links { display: flex; align-items: center; gap: 2px; flex: 1; }
.nav-links a { color: #8b949e; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; transition: color 0.15s, background 0.15s; }
.nav-links a:hover { color: #e6edf3; background: #21262d; }
.nav-links a.router-link-active { color: #58a6ff; }

.nav-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }

.logout-btn { padding: 5px 10px; background: transparent; border: 1px solid #30363d; color: #8b949e; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.logout-btn:hover { border-color: #f85149; color: #f85149; }

.login-link { padding: 5px 14px; background: #238636; color: #fff !important; border-radius: 6px; font-size: 0.82rem; text-decoration: none; }
.login-link:hover { background: #2ea043; }

.refresh-bar { position: fixed; top: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #58a6ff 0%, #3fb950 50%, #58a6ff 100%); background-size: 200% 100%; animation: slide 1.2s linear infinite; z-index: 9999; }
@keyframes slide { 0% { background-position: 200% 0; } 100% { background-position: 0% 0; } }

/* Hamburger */
.hamburger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 4px; }
.hamburger span { display: block; width: 20px; height: 2px; background: #8b949e; border-radius: 2px; }

/* Mobile menu */
.mobile-menu { display: none; flex-direction: column; background: #161b22; border-bottom: 1px solid #21262d; }
.mobile-menu a { padding: 12px 20px; color: #8b949e; text-decoration: none; font-size: 0.9rem; border-bottom: 1px solid #21262d; }
.mobile-menu a:hover, .mobile-menu a.router-link-active { color: #58a6ff; background: #21262d; }

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .hamburger { display: flex; }
  .mobile-menu { display: flex; }
}
</style>
