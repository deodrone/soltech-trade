<template>
  <div class="token-card" @click="$emit('click', token)">
    <div class="tc-left">
      <token-logo :src="token.logo || token.image" :symbol="token.symbol" :size="36" />
      <div class="tc-names">
        <span class="tc-symbol">{{ token.symbol }}</span>
        <span class="tc-name">{{ truncate(token.name, 16) }}</span>
      </div>
    </div>
    <div class="tc-metrics">
      <div class="tc-metric">
        <span class="ml">Price</span>
        <span class="mv">${{ formatPrice(token.price || token.priceUsd) }}</span>
      </div>
      <div class="tc-metric">
        <span class="ml">24h</span>
        <price-change :value="token.change24h || 0" />
      </div>
      <div class="tc-metric">
        <span class="ml">Vol</span>
        <span class="mv">{{ formatLarge(token.volume24h || token.usdMarketCap) }}</span>
      </div>
      <div class="tc-metric">
        <span class="ml">MCap</span>
        <span class="mv">{{ formatLarge(token.marketCap) }}</span>
      </div>
      <div v-if="token.liquidity" class="tc-metric">
        <span class="ml">Liq</span>
        <span class="mv">{{ formatLarge(token.liquidity) }}</span>
      </div>
      <div v-if="token.progress !== undefined" class="tc-metric progress-col">
        <span class="ml">BC%</span>
        <div class="progress-bar"><div class="progress-fill" :style="{ width: token.progress + '%' }" /></div>
      </div>
      <div class="tc-safety" :class="safetyClass">{{ safetyLabel }}</div>
    </div>
    <button class="quick-trade" @click.stop="$emit('trade', token)">Trade</button>
  </div>
</template>

<script>
import TokenLogo from '../common/TokenLogo.vue';
import PriceChange from '../common/PriceChange.vue';

export default {
  components: { TokenLogo, PriceChange },
  props: { token: Object },
  emits: ['click', 'trade'],
  computed: {
    safetyClass() {
      const liq = this.token.liquidity || 0;
      if (liq > 50000) return 'safe';
      if (liq > 10000) return 'caution';
      return 'risky';
    },
    safetyLabel() {
      const liq = this.token.liquidity || 0;
      if (liq > 50000) return '✓';
      if (liq > 10000) return '⚠';
      return '✕';
    },
  },
  methods: {
    formatPrice(p) {
      if (!p) return '—';
      if (p < 0.000001) return p.toExponential(2);
      if (p < 0.01) return p.toFixed(8);
      if (p < 1) return p.toFixed(4);
      return p.toFixed(2);
    },
    formatLarge(v) {
      if (!v) return '—';
      if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`;
      if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
      if (v >= 1e3) return `$${(v/1e3).toFixed(1)}K`;
      return `$${v.toFixed(0)}`;
    },
    truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '...' : s; },
  },
};
</script>

<style scoped>
.token-card { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #21262d; cursor: pointer; transition: background 0.1s; }
.token-card:hover { background: #161b22; }
.tc-left { display: flex; align-items: center; gap: 8px; min-width: 120px; }
.tc-names { display: flex; flex-direction: column; }
.tc-symbol { font-weight: 700; font-size: 0.85rem; color: #e6edf3; }
.tc-name { font-size: 0.7rem; color: #8b949e; }
.tc-metrics { display: flex; align-items: center; gap: 16px; flex: 1; flex-wrap: wrap; }
.tc-metric { display: flex; flex-direction: column; align-items: flex-end; min-width: 60px; }
.ml { font-size: 0.65rem; color: #8b949e; text-transform: uppercase; }
.mv { font-size: 0.8rem; color: #e6edf3; font-family: monospace; }
.progress-col { min-width: 70px; }
.progress-bar { width: 60px; height: 5px; background: #30363d; border-radius: 3px; overflow: hidden; margin-top: 2px; }
.progress-fill { height: 100%; background: #58a6ff; border-radius: 3px; transition: width 0.3s; }
.tc-safety { font-size: 0.75rem; width: 20px; text-align: center; }
.safe { color: #3fb950; }
.caution { color: #d29922; }
.risky { color: #f85149; }
.quick-trade { padding: 4px 12px; background: rgba(88,166,255,0.15); border: 1px solid #58a6ff; color: #58a6ff; border-radius: 5px; cursor: pointer; font-size: 0.75rem; white-space: nowrap; }
.quick-trade:hover { background: rgba(88,166,255,0.25); }
</style>
