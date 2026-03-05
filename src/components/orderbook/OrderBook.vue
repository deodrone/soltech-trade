<template>
  <div class="orderbook">
    <div class="ob-header">
      <span>Recent Trades</span>
      <span :class="['live-dot', loading ? 'pulse' : '']">●</span>
    </div>
    <div class="ob-labels">
      <span>Price (USD)</span>
      <span>Amount</span>
      <span>Age</span>
    </div>

    <div v-if="loading && !trades.length" class="ob-loading">Loading...</div>
    <div v-else-if="!trades.length" class="ob-empty">No trades found</div>

    <div class="ob-trades">
      <div
        v-for="(t, i) in trades"
        :key="t.txHash + i"
        :class="['ob-row', t.side === 'buy' ? 'buy' : 'sell']"
      >
        <div class="depth-bar" :class="t.side === 'buy' ? 'bid-bar' : 'ask-bar'" :style="{ width: t.depthPct + '%' }" />
        <span :class="['price', t.side === 'buy' ? 'green' : 'red']">{{ fmtPrice(t.price) }}</span>
        <span class="size">{{ fmtAmt(t.from?.amount) }}</span>
        <span class="age">{{ relTime(t.blockUnixTime) }}</span>
      </div>
    </div>

    <div class="ob-mid">
      <span class="mid-price">${{ midPrice }}</span>
      <price-change :value="priceChange" />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useBirdeye } from '../../composables/useBirdeye';
import { useDexScreener } from '../../composables/useDexScreener';
import PriceChange from '../common/PriceChange.vue';

export default {
  components: { PriceChange },
  props: { tokenMint: String },
  setup(props) {
    const { getTrades, loading } = useBirdeye();
    const { getTokenPairs } = useDexScreener();
    const trades = ref([]);
    const rawPrice = ref(0);
    const priceChange = ref(0);
    let interval = null;

    const midPrice = computed(() => rawPrice.value ? rawPrice.value.toPrecision(5) : '—');

    const maxVol = computed(() => {
      const vols = trades.value.map(t => parseFloat(t.from?.amount || 0));
      return Math.max(...vols, 1);
    });

    async function refresh() {
      if (!props.tokenMint) return;
      const [rawTrades, pairs] = await Promise.all([
        getTrades(props.tokenMint, 30),
        getTokenPairs(props.tokenMint),
      ]);

      if (pairs.length) {
        rawPrice.value = parseFloat(pairs[0].priceUsd || 0);
        priceChange.value = pairs[0].priceChange?.h1 || 0;
      }

      const maxAmt = Math.max(...rawTrades.map(t => parseFloat(t.from?.amount || 0)), 1);
      trades.value = rawTrades.map(t => ({
        ...t,
        side: t.side || (t.from?.symbol === 'SOL' ? 'buy' : 'sell'),
        depthPct: Math.min(100, (parseFloat(t.from?.amount || 0) / maxAmt) * 100),
      }));
    }

    const fmtPrice = p => {
      if (!p) return '—';
      if (p < 0.000001) return p.toExponential(2);
      if (p < 0.01) return p.toFixed(8);
      if (p < 1) return p.toFixed(5);
      return p.toFixed(3);
    };
    const fmtAmt = a => {
      if (!a) return '—';
      const n = parseFloat(a);
      if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
      if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
      return n.toFixed(2);
    };
    const relTime = ts => {
      if (!ts) return '';
      const s = Math.floor(Date.now() / 1000) - ts;
      if (s < 60) return `${s}s`;
      if (s < 3600) return `${Math.floor(s / 60)}m`;
      return `${Math.floor(s / 3600)}h`;
    };

    onMounted(() => { refresh(); interval = setInterval(refresh, 15000); });
    onUnmounted(() => clearInterval(interval));
    watch(() => props.tokenMint, refresh);

    return { trades, loading, midPrice, priceChange, fmtPrice, fmtAmt, relTime };
  },
};
</script>

<style scoped>
.orderbook { background: #0d1117; height: 100%; display: flex; flex-direction: column; font-size: 0.75rem; }
.ob-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; font-weight: 600; color: #e6edf3; border-bottom: 1px solid #21262d; font-size: 0.8rem; }
.live-dot { color: #3fb950; font-size: 0.6rem; }
.live-dot.pulse { animation: blink 1.2s infinite; }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
.ob-labels { display: grid; grid-template-columns: 1fr 1fr 50px; padding: 4px 10px; color: #8b949e; font-size: 0.65rem; border-bottom: 1px solid #21262d; }
.ob-labels span { text-align: right; }
.ob-loading, .ob-empty { padding: 20px; text-align: center; color: #8b949e; font-size: 0.78rem; }
.ob-trades { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.ob-row { display: grid; grid-template-columns: 1fr 1fr 50px; padding: 3px 10px; position: relative; align-items: center; }
.ob-row:hover { background: rgba(255,255,255,0.04); }
.depth-bar { position: absolute; top: 0; right: 0; height: 100%; opacity: 0.1; }
.ask-bar { background: #f85149; }
.bid-bar { background: #3fb950; }
.price, .size, .age { text-align: right; z-index: 1; position: relative; font-family: monospace; font-size: 0.72rem; }
.green { color: #3fb950; }
.red { color: #f85149; }
.size { color: #8b949e; }
.age { color: #484f58; }
.ob-mid { padding: 6px 10px; border-top: 1px solid #21262d; display: flex; align-items: center; gap: 8px; background: #161b22; flex-shrink: 0; }
.mid-price { font-weight: 700; font-size: 0.9rem; color: #e6edf3; }
</style>
