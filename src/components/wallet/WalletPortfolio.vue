<template>
  <div class="wallet-portfolio">
    <div class="wp-header">
      <div class="wp-total">
        <span class="wp-label">Total Value</span>
        <span class="wp-value">${{ totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
      </div>
      <button class="refresh-btn" @click="refresh" :disabled="loading">↻ Refresh</button>
    </div>

    <div v-if="loading" class="loading">Loading portfolio...</div>

    <div v-else-if="!connected" class="empty">Connect your wallet to view holdings</div>

    <div v-else-if="!holdings.length" class="empty">No token holdings found</div>

    <div v-else class="holdings-table">
      <div class="ht-header">
        <span>Token</span>
        <span>Balance</span>
        <span>Price</span>
        <span>Value</span>
        <span>24h</span>
        <span></span>
      </div>
      <div v-for="h in holdings" :key="h.mint" class="ht-row">
        <div class="ht-token">
          <token-logo :src="h.logo" :symbol="h.symbol" :size="28" />
          <div class="ht-names">
            <span class="ht-symbol">{{ h.symbol }}</span>
            <span class="ht-name">{{ h.name }}</span>
          </div>
        </div>
        <span class="ht-bal">{{ fmtBalance(h.balance, h.decimals) }}</span>
        <span class="ht-price">${{ fmtPrice(h.priceUsd) }}</span>
        <span class="ht-val">${{ fmtUsd(h.valueUsd) }}</span>
        <price-change :value="h.change24h" />
        <div class="ht-actions">
          <button class="trade-btn" @click="$emit('trade', h)">Trade</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { usePortfolio } from '../../composables/usePortfolio';
import TokenLogo from '../common/TokenLogo.vue';
import PriceChange from '../common/PriceChange.vue';

export default {
  components: { TokenLogo, PriceChange },
  emits: ['trade'],
  setup() {
    const store = useStore();
    const { holdings, loading, totalUsd, loadPortfolio } = usePortfolio();
    const connected = computed(() => store.state.wallet.connected);

    function refresh() { if (connected.value) loadPortfolio(); }
    onMounted(() => { if (connected.value) loadPortfolio(); });

    function fmtBalance(bal, dec) {
      const n = bal / Math.pow(10, dec || 6);
      if (n >= 1e6) return `${(n/1e6).toFixed(2)}M`;
      if (n >= 1e3) return `${(n/1e3).toFixed(2)}K`;
      return n.toFixed(4);
    }
    function fmtPrice(p) { if (!p) return '—'; if (p < 0.0001) return p.toExponential(3); return p.toFixed(p < 1 ? 6 : 2); }
    function fmtUsd(v) { if (!v) return '—'; if (v >= 1e3) return (v/1e3).toFixed(2)+'K'; return v.toFixed(2); }

    return { holdings, loading, totalUsd, connected, refresh, fmtBalance, fmtPrice, fmtUsd };
  }
};
</script>

<style scoped>
.wallet-portfolio { background: #0d1117; }
.wp-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 16px; border-bottom: 1px solid #21262d; }
.wp-label { font-size: 0.7rem; color: #8b949e; display: block; }
.wp-value { font-size: 1.6rem; font-weight: 700; color: #e6edf3; font-family: monospace; }
.refresh-btn { padding: 6px 12px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; font-size: 0.8rem; }
.refresh-btn:hover { color: #e6edf3; }
.loading, .empty { padding: 40px; text-align: center; color: #8b949e; }
.holdings-table { width: 100%; }
.ht-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px 70px; padding: 8px 16px; font-size: 0.7rem; color: #8b949e; text-transform: uppercase; border-bottom: 1px solid #21262d; }
.ht-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px 70px; padding: 10px 16px; border-bottom: 1px solid #161b22; align-items: center; }
.ht-row:hover { background: #161b22; }
.ht-token { display: flex; align-items: center; gap: 8px; }
.ht-names { display: flex; flex-direction: column; }
.ht-symbol { font-weight: 600; color: #e6edf3; font-size: 0.85rem; }
.ht-name { font-size: 0.65rem; color: #8b949e; }
.ht-bal, .ht-price, .ht-val { font-family: monospace; font-size: 0.82rem; color: #e6edf3; }
.trade-btn { padding: 4px 10px; background: #1f6feb33; border: 1px solid #1f6feb; border-radius: 4px; color: #58a6ff; cursor: pointer; font-size: 0.75rem; }
.trade-btn:hover { background: #1f6feb55; }
</style>
