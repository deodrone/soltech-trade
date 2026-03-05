<template>
  <div class="token-stats-bar">
    <div class="tsb-item">
      <span class="tsb-label">Price</span>
      <span class="tsb-value">${{ price }}</span>
    </div>
    <price-change :value="change24h" class="tsb-change" />
    <div class="divider" />
    <div class="tsb-item">
      <span class="tsb-label">Vol 24h</span>
      <span class="tsb-value">{{ fmtLg(vol24h) }}</span>
    </div>
    <div class="tsb-item">
      <span class="tsb-label">Liq</span>
      <span class="tsb-value">{{ fmtLg(liquidity) }}</span>
    </div>
    <div class="tsb-item">
      <span class="tsb-label">MCap</span>
      <span class="tsb-value">{{ fmtLg(mcap) }}</span>
    </div>
    <div class="tsb-item">
      <span class="tsb-label">FDV</span>
      <span class="tsb-value">{{ fmtLg(fdv) }}</span>
    </div>
  </div>
</template>

<script>
import PriceChange from './PriceChange.vue';
export default {
  components: { PriceChange },
  props: {
    price:    { type: [Number, String], default: 0 },
    change24h:{ type: Number, default: 0 },
    vol24h:   { type: Number, default: 0 },
    liquidity:{ type: Number, default: 0 },
    mcap:     { type: Number, default: 0 },
    fdv:      { type: Number, default: 0 },
  },
  methods: {
    fmtLg(v) {
      if (!v) return '—';
      if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`;
      if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
      if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`;
      return `$${v.toFixed(0)}`;
    }
  }
};
</script>

<style scoped>
.token-stats-bar { display: flex; align-items: center; gap: 16px; padding: 8px 16px; background: #161b22; border-bottom: 1px solid #21262d; overflow-x: auto; flex-wrap: nowrap; white-space: nowrap; }
.tsb-item { display: flex; flex-direction: column; align-items: center; min-width: 55px; }
.tsb-label { font-size: 0.6rem; color: #8b949e; text-transform: uppercase; }
.tsb-value { font-size: 0.8rem; color: #e6edf3; font-family: monospace; font-weight: 600; }
.divider { width: 1px; height: 24px; background: #30363d; flex-shrink: 0; }
.tsb-change { font-size: 0.8rem; }
</style>
