<template>
  <div class="wallet-pnl">
    <div class="pnl-header">
      <span>PnL Overview</span>
      <div class="pnl-period">
        <button v-for="p in periods" :key="p" :class="['period-btn', { active: period === p }]" @click="period = p">{{ p }}</button>
      </div>
    </div>

    <div class="pnl-summary">
      <div class="pnl-card">
        <span class="pnl-label">Realized PnL</span>
        <span class="pnl-val" :class="realizedPnl >= 0 ? 'pos' : 'neg'">
          {{ realizedPnl >= 0 ? '+' : '' }}${{ Math.abs(realizedPnl).toFixed(2) }}
        </span>
      </div>
      <div class="pnl-card">
        <span class="pnl-label">Unrealized PnL</span>
        <span class="pnl-val" :class="unrealizedPnl >= 0 ? 'pos' : 'neg'">
          {{ unrealizedPnl >= 0 ? '+' : '' }}${{ Math.abs(unrealizedPnl).toFixed(2) }}
        </span>
      </div>
      <div class="pnl-card">
        <span class="pnl-label">Total PnL</span>
        <span class="pnl-val" :class="totalPnl >= 0 ? 'pos' : 'neg'">
          {{ totalPnl >= 0 ? '+' : '' }}${{ Math.abs(totalPnl).toFixed(2) }}
        </span>
      </div>
      <div class="pnl-card">
        <span class="pnl-label">Win Rate</span>
        <span class="pnl-val">{{ winRate }}%</span>
      </div>
    </div>

    <div class="chart-placeholder">
      <div ref="chartEl" class="pnl-chart" />
      <div v-if="!pnlData.length" class="no-data">Connect wallet to view PnL history</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const store = useStore();
    const period = ref('7D');
    const periods = ['24H', '7D', '30D', 'All'];
    const pnlData = ref([]);

    const walletPnl = computed(() => store.state.analytics.walletPnl);
    const realizedPnl = computed(() => walletPnl.value?.realized || 0);
    const unrealizedPnl = computed(() => walletPnl.value?.unrealized || 0);
    const totalPnl = computed(() => realizedPnl.value + unrealizedPnl.value);
    const winRate = computed(() => {
      const wins = walletPnl.value?.wins || 0;
      const total = walletPnl.value?.total || 0;
      return total ? ((wins / total) * 100).toFixed(0) : '—';
    });

    return { period, periods, pnlData, realizedPnl, unrealizedPnl, totalPnl, winRate };
  }
};
</script>

<style scoped>
.wallet-pnl { background: #0d1117; }
.pnl-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #21262d; }
.pnl-header span { font-weight: 600; color: #e6edf3; }
.pnl-period { display: flex; gap: 4px; }
.period-btn { padding: 3px 10px; background: none; border: 1px solid #30363d; border-radius: 4px; color: #8b949e; cursor: pointer; font-size: 0.75rem; }
.period-btn.active { border-color: #58a6ff; color: #58a6ff; }
.pnl-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #21262d; }
.pnl-card { background: #0d1117; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pnl-label { font-size: 0.7rem; color: #8b949e; text-transform: uppercase; }
.pnl-val { font-size: 1.2rem; font-weight: 700; font-family: monospace; color: #e6edf3; }
.pos { color: #3fb950; }
.neg { color: #f85149; }
.chart-placeholder { position: relative; height: 200px; }
.pnl-chart { width: 100%; height: 100%; }
.no-data { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #8b949e; font-size: 0.85rem; }
</style>
