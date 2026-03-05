<template>
  <div class="alerts-page">
    <div class="al-header">
      <h1>Alerts</h1>
      <div class="al-header-right">
        <span :class="['ws-status', wsConnected ? 'live' : 'offline']">
          {{ wsConnected ? '● Live' : '○ Offline' }}
        </span>
        <wallet-connect />
      </div>
    </div>

    <div v-if="!isLoggedIn" class="auth-prompt">
      <div class="auth-card">
        <span class="auth-icon">🔔</span>
        <h3>Sign in to manage alerts</h3>
        <p>Price and wallet alerts require an account to persist across sessions and receive push notifications.</p>
        <router-link to="/login" class="signin-btn">Sign In</router-link>
      </div>
    </div>

    <div v-else class="alerts-layout">
      <div class="alerts-left">
        <alert-manager />
      </div>
      <div class="alerts-right">
        <alert-feed />
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useWebSocket } from '../composables/useWebSocket';
import { useAlerts } from '../composables/useAlerts';
import AlertManager from '../components/alerts/AlertManager.vue';
import AlertFeed from '../components/alerts/AlertFeed.vue';
import WalletConnect from '../components/wallet/WalletConnect.vue';

export default {
  components: { AlertManager, AlertFeed, WalletConnect },
  setup() {
    const store = useStore();
    const { connected: wsConnected, connect, on, off, disconnect } = useWebSocket();
    const { handleWsEvent } = useAlerts();
    const isLoggedIn = computed(() => store.getters.isLoggedIn);

    function onAlertEvent(msg) { handleWsEvent(msg); }

    onMounted(async () => {
      if (isLoggedIn.value) {
        const token = await store.getters.currentUser?.getIdToken();
        connect(token);
        on('alert_triggered', onAlertEvent);
        on('whale_trade', onAlertEvent);
      }
    });

    onUnmounted(() => {
      off('alert_triggered', onAlertEvent);
      off('whale_trade', onAlertEvent);
    });

    return { wsConnected, isLoggedIn };
  }
};
</script>

<style scoped>
.alerts-page { padding: 24px; background: #0d1117; min-height: calc(100vh - 48px); }
.al-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.al-header h1 { color: #e6edf3; margin: 0; }
.al-header-right { display: flex; align-items: center; gap: 12px; }
.ws-status { font-size: 0.78rem; padding: 4px 10px; border-radius: 12px; }
.ws-status.live { color: #3fb950; background: #3fb95022; }
.ws-status.offline { color: #8b949e; background: #21262d; }
.auth-prompt { display: flex; justify-content: center; padding: 60px 0; }
.auth-card { text-align: center; max-width: 400px; padding: 40px; background: #161b22; border: 1px solid #21262d; border-radius: 12px; }
.auth-icon { font-size: 3rem; display: block; margin-bottom: 16px; }
.auth-card h3 { color: #e6edf3; margin: 0 0 8px; }
.auth-card p { color: #8b949e; font-size: 0.85rem; line-height: 1.5; margin: 0 0 20px; }
.signin-btn { display: inline-block; padding: 10px 28px; background: #1f6feb; color: #fff; border-radius: 6px; text-decoration: none; font-weight: 600; }
.alerts-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 768px) { .alerts-layout { grid-template-columns: 1fr; } }
</style>
