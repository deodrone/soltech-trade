<template>
  <div class="alert-feed">
    <div class="af-header">
      <span>🔔 Alert Feed</span>
      <span :class="['ws-dot', wsConnected ? 'connected' : 'disconnected']" :title="wsConnected ? 'Live' : 'Offline'" />
    </div>
    <div v-if="!history.length" class="empty">No alerts triggered yet</div>
    <div v-for="ev in history" :key="ev.id || ev.timestamp" class="alert-event">
      <span class="ae-icon">{{ ev.type === 'price' ? '💰' : '🐋' }}</span>
      <div class="ae-body">
        <span class="ae-msg">{{ ev.message }}</span>
        <span class="ae-time">{{ timeAgo(ev.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const store = useStore();
    const history = computed(() => store.getters['alerts/alertHistory']);
    const wsConnected = computed(() => store.getters['alerts/wsConnected']);

    function timeAgo(ts) {
      const s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return `${s}s ago`;
      if (s < 3600) return `${Math.floor(s / 60)}m ago`;
      return `${Math.floor(s / 3600)}h ago`;
    }

    return { history, wsConnected, timeAgo };
  },
};
</script>

<style scoped>
.alert-feed { background: #0d1117; height: 100%; }
.af-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #21262d; font-weight: 600; font-size: 0.82rem; color: #e6edf3; }
.ws-dot { width: 8px; height: 8px; border-radius: 50%; margin-left: auto; }
.connected { background: #3fb950; }
.disconnected { background: #8b949e; }
.empty { padding: 16px; text-align: center; color: #8b949e; font-size: 0.8rem; }
.alert-event { display: flex; align-items: flex-start; gap: 8px; padding: 7px 12px; border-bottom: 1px solid #161b22; }
.ae-icon { font-size: 0.9rem; }
.ae-body { display: flex; flex-direction: column; gap: 1px; }
.ae-msg { font-size: 0.78rem; color: #e6edf3; }
.ae-time { font-size: 0.68rem; color: #8b949e; }
</style>
