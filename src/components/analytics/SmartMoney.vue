<template>
  <div class="smart-money">
    <div class="sm-header">
      <span>🐋 Top Traders</span>
      <button class="refresh" @click="load">↻</button>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="sm-table">
      <div class="sm-thead"><span>Wallet</span><span>Volume</span><span>Trades</span><span>PnL</span><span></span></div>
      <div v-for="t in traders" :key="t.address" class="sm-row">
        <span class="addr">{{ t.address?.slice(0,6) }}...{{ t.address?.slice(-4) }}</span>
        <span class="mono">${{ fmtLg(t.volume) }}</span>
        <span class="mono">{{ t.trades }}</span>
        <span :class="t.pnl >= 0 ? 'green' : 'red'">{{ t.pnl >= 0 ? '+' : '' }}{{ fmtLg(Math.abs(t.pnl)) }}</span>
        <button class="copy-btn" @click="$emit('copy', t.address)">Copy</button>
      </div>
    </div>
    <div v-if="!loading && !traders.length" class="empty">No trader data</div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useSmartMoney } from '../../composables/useSmartMoney';

export default {
  props: { tokenMint: String },
  emits: ['copy'],
  setup(props) {
    const { getTopWallets, loading } = useSmartMoney();
    const traders = ref([]);

    async function load() {
      if (!props.tokenMint) return;
      const raw = await getTopWallets(props.tokenMint);
      traders.value = raw.map(t => ({
        address: t.address,
        volume: t.volume || 0,
        trades: t.tradingCount || 0,
        pnl: t.pnl || 0,
      }));
    }

    onMounted(load);
    watch(() => props.tokenMint, load);

    const fmtLg = v => { if (!v) return '0'; if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`; return `$${v.toFixed(0)}`; };

    return { traders, loading, load, fmtLg };
  },
};
</script>

<style scoped>
.smart-money { background: #0d1117; }
.sm-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #21262d; font-weight: 600; font-size: 0.82rem; color: #e6edf3; }
.refresh { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 2px 6px; cursor: pointer; font-size: 0.8rem; }
.loading, .empty { padding: 16px; text-align: center; color: #8b949e; font-size: 0.8rem; }
.sm-thead { display: grid; grid-template-columns: 120px 80px 60px 80px 60px; gap: 8px; padding: 5px 12px; font-size: 0.65rem; color: #8b949e; text-transform: uppercase; border-bottom: 1px solid #21262d; }
.sm-row { display: grid; grid-template-columns: 120px 80px 60px 80px 60px; gap: 8px; padding: 6px 12px; border-bottom: 1px solid #161b22; align-items: center; }
.sm-row:hover { background: #161b22; }
.addr { font-family: monospace; font-size: 0.75rem; color: #58a6ff; cursor: pointer; }
.mono { font-family: monospace; font-size: 0.75rem; color: #e6edf3; }
.green { color: #3fb950; font-size: 0.75rem; font-family: monospace; }
.red { color: #f85149; font-size: 0.75rem; font-family: monospace; }
.copy-btn { padding: 2px 8px; background: rgba(88,166,255,0.12); border: 1px solid #58a6ff; color: #58a6ff; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
.copy-btn:hover { background: rgba(88,166,255,0.25); }
</style>
