<template>
  <div class="orderbook">
    <div class="ob-header">Order Book</div>
    <div class="ob-labels"><span>Price (USDC)</span><span>Size</span><span>Total</span></div>
    <div class="ob-asks">
      <div v-for="ask in asks" :key="ask.price" class="ob-row ask">
        <div class="depth-bar ask-bar" :style="{ width: ask.depthPct + '%' }" />
        <span class="price red">{{ ask.price }}</span>
        <span class="size">{{ ask.size }}</span>
        <span class="total">{{ ask.total }}</span>
      </div>
    </div>
    <div class="ob-mid">
      <span class="mid-price">${{ midPrice }}</span>
      <price-change :value="priceChange" />
    </div>
    <div class="ob-bids">
      <div v-for="bid in bids" :key="bid.price" class="ob-row bid">
        <div class="depth-bar bid-bar" :style="{ width: bid.depthPct + '%' }" />
        <span class="price green">{{ bid.price }}</span>
        <span class="size">{{ bid.size }}</span>
        <span class="total">{{ bid.total }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDexScreener } from '../../composables/useDexScreener';
import PriceChange from '../common/PriceChange.vue';

export default {
  components: { PriceChange },
  props: { tokenMint: String },
  setup(props) {
    const { getTokenPairs } = useDexScreener();
    const rawPrice = ref(0);
    const priceChange = ref(0);
    let interval = null;

    // Generate simulated orderbook from real price
    const asks = computed(() => {
      if (!rawPrice.value) return mockAsks;
      const p = rawPrice.value;
      const rows = [];
      let cum = 0;
      for (let i = 0; i < 8; i++) {
        const spread = p * (0.0002 + i * 0.0003);
        const size = (Math.random() * 5 + 0.1).toFixed(3);
        cum += parseFloat(size);
        rows.push({ price: (p + spread).toFixed(6), size, total: cum.toFixed(3), depthPct: Math.min(100, (parseFloat(size) / 10) * 100) });
      }
      return rows.reverse();
    });

    const bids = computed(() => {
      if (!rawPrice.value) return mockBids;
      const p = rawPrice.value;
      const rows = [];
      let cum = 0;
      for (let i = 0; i < 8; i++) {
        const spread = p * (0.0002 + i * 0.0003);
        const size = (Math.random() * 5 + 0.1).toFixed(3);
        cum += parseFloat(size);
        rows.push({ price: (p - spread).toFixed(6), size, total: cum.toFixed(3), depthPct: Math.min(100, (parseFloat(size) / 10) * 100) });
      }
      return rows;
    });

    const midPrice = computed(() => rawPrice.value ? rawPrice.value.toFixed(6) : '—');

    async function refresh() {
      if (!props.tokenMint) return;
      const pairs = await getTokenPairs(props.tokenMint);
      if (pairs.length) {
        rawPrice.value = parseFloat(pairs[0].priceUsd || 0);
        priceChange.value = pairs[0].priceChange?.h1 || 0;
      }
    }

    onMounted(() => { refresh(); interval = setInterval(refresh, 15000); });
    onUnmounted(() => clearInterval(interval));
    watch(() => props.tokenMint, refresh);

    const mockAsks = [
      { price: '46200', size: '2.30', total: '2.30', depthPct: 45 },
      { price: '46150', size: '1.45', total: '3.75', depthPct: 30 },
      { price: '46100', size: '0.82', total: '4.57', depthPct: 18 },
      { price: '46050', size: '0.42', total: '4.99', depthPct: 10 },
    ].reverse();
    const mockBids = [
      { price: '46000', size: '0.55', total: '0.55', depthPct: 12 },
      { price: '45950', size: '1.20', total: '1.75', depthPct: 25 },
      { price: '45900', size: '2.10', total: '3.85', depthPct: 42 },
      { price: '45850', size: '3.10', total: '6.95', depthPct: 62 },
    ];

    return { asks, bids, midPrice, priceChange };
  },
};
</script>

<style scoped>
.orderbook { background: #0d1117; height: 100%; display: flex; flex-direction: column; font-size: 0.75rem; }
.ob-header { padding: 8px 10px; font-weight: 600; color: #e6edf3; border-bottom: 1px solid #21262d; font-size: 0.8rem; }
.ob-labels { display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 4px 10px; color: #8b949e; font-size: 0.65rem; border-bottom: 1px solid #21262d; }
.ob-labels span { text-align: right; }
.ob-asks, .ob-bids { display: flex; flex-direction: column; }
.ob-row { display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 3px 10px; position: relative; align-items: center; }
.ob-row:hover { background: rgba(255,255,255,0.04); }
.depth-bar { position: absolute; top: 0; right: 0; height: 100%; opacity: 0.12; }
.ask-bar { background: #f85149; }
.bid-bar { background: #3fb950; }
.price, .size, .total { text-align: right; z-index: 1; position: relative; font-family: monospace; font-size: 0.72rem; }
.red { color: #f85149; }
.green { color: #3fb950; }
.size, .total { color: #8b949e; }
.ob-mid { padding: 6px 10px; border-top: 1px solid #21262d; border-bottom: 1px solid #21262d; display: flex; align-items: center; gap: 8px; background: #161b22; }
.mid-price { font-weight: 700; font-size: 0.9rem; color: #e6edf3; }
</style>
