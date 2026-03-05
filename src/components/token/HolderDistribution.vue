<template>
  <div class="holder-dist">
    <div class="hd-header">
      <span class="hd-title">Top Holders</span>
      <button class="refresh-btn" @click="load" :disabled="loading">↻</button>
    </div>

    <div v-if="loading" class="loading">Loading holders...</div>

    <template v-else-if="holders.length">
      <!-- Concentration Bar -->
      <div class="concentration-bar">
        <div
          v-for="(h, i) in holders.slice(0, 10)"
          :key="i"
          class="bar-segment"
          :style="{ width: h.pct + '%', background: segmentColor(i) }"
          :title="`${h.address?.slice(0,6)}... — ${h.pct}%`"
        />
      </div>
      <div class="bar-legend">
        <span class="legend-item" v-for="(h, i) in holders.slice(0, 3)" :key="i">
          <span class="legend-dot" :style="{ background: segmentColor(i) }" />
          {{ h.pct }}%
        </span>
        <span class="legend-rest" v-if="holders.length > 3">+{{ holders.length - 3 }} more</span>
      </div>

      <!-- Holders Table -->
      <div class="holder-table">
        <div class="ht-header"><span>#</span><span>Address</span><span>Amount</span><span>Share</span></div>
        <div v-for="h in holders" :key="h.address" class="ht-row">
          <span class="ht-rank">{{ h.rank }}</span>
          <a :href="`https://solscan.io/account/${h.address}`" target="_blank" class="ht-addr">
            {{ h.address?.slice(0, 6) }}...{{ h.address?.slice(-4) }} ↗
          </a>
          <span class="ht-amount">{{ fmtAmt(h.amount) }}</span>
          <div class="ht-pct-cell">
            <span :class="['ht-pct', pctClass(parseFloat(h.pct))]">{{ h.pct }}%</span>
            <div class="mini-bar"><div class="mini-fill" :style="{ width: Math.min(parseFloat(h.pct), 100) + '%' }" /></div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!loading" class="empty">No holder data</div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useTokenSafety } from '../../composables/useTokenSafety';

const COLORS = ['#58a6ff','#3fb950','#d29922','#f85149','#a371f7','#79c0ff','#56d364','#e3b341','#ff7b72','#bc8cff'];

export default {
  name: 'HolderDistribution',
  props: { tokenMint: { type: String, required: true } },
  setup(props) {
    const { getTopHolders } = useTokenSafety();
    const holders = ref([]);
    const loading = ref(false);

    async function load() {
      if (!props.tokenMint) return;
      loading.value = true;
      holders.value = await getTopHolders(props.tokenMint);
      loading.value = false;
    }

    onMounted(load);
    watch(() => props.tokenMint, load);

    const segmentColor = (i) => COLORS[i % COLORS.length];
    const fmtAmt = v => {
      if (!v) return '0';
      if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
      if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
      if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
      return v.toFixed(2);
    };
    const pctClass = p => p > 15 ? 'red' : p > 5 ? 'yellow' : 'green';

    return { holders, loading, load, segmentColor, fmtAmt, pctClass };
  },
};
</script>

<style scoped>
.holder-dist { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; }
.hd-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.hd-title { font-size: 0.8rem; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.04em; }
.refresh-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 2px 7px; cursor: pointer; font-size: 0.75rem; }
.loading, .empty { padding: 12px; text-align: center; color: #8b949e; font-size: 0.8rem; }
.concentration-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: #21262d; margin-bottom: 6px; }
.bar-segment { height: 100%; transition: width 0.4s; cursor: default; }
.bar-legend { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 0.7rem; color: #8b949e; }
.legend-item { display: flex; align-items: center; gap: 3px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-rest { color: #8b949e; }
.holder-table { }
.ht-header { display: grid; grid-template-columns: 24px 1fr 80px 90px; gap: 6px; padding: 4px 0; font-size: 0.65rem; color: #8b949e; text-transform: uppercase; border-bottom: 1px solid #21262d; margin-bottom: 2px; }
.ht-row { display: grid; grid-template-columns: 24px 1fr 80px 90px; gap: 6px; padding: 5px 0; border-bottom: 1px solid #161b22; align-items: center; }
.ht-row:last-child { border-bottom: none; }
.ht-rank { font-size: 0.7rem; color: #8b949e; }
.ht-addr { font-family: monospace; font-size: 0.72rem; color: #58a6ff; text-decoration: none; }
.ht-addr:hover { text-decoration: underline; }
.ht-amount { font-family: monospace; font-size: 0.72rem; color: #e6edf3; text-align: right; }
.ht-pct-cell { display: flex; align-items: center; gap: 6px; }
.ht-pct { font-family: monospace; font-size: 0.72rem; font-weight: 600; min-width: 38px; text-align: right; }
.ht-pct.green  { color: #3fb950; }
.ht-pct.yellow { color: #d29922; }
.ht-pct.red    { color: #f85149; }
.mini-bar { flex: 1; height: 3px; background: #21262d; border-radius: 2px; overflow: hidden; }
.mini-fill { height: 100%; background: #58a6ff; border-radius: 2px; }
</style>
