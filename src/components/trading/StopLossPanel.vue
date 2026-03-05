<template>
  <div class="sl-panel">
    <div class="sl-form">
      <div class="sl-title">Stop Loss / Take Profit</div>
      <div class="sl-subtitle">Orders execute automatically when price is reached</div>

      <div class="form-row">
        <div class="field">
          <label>Token Mint</label>
          <input v-model="form.mint" placeholder="Mint address..." class="field-input" />
        </div>
        <div class="field">
          <label>Amount (SOL)</label>
          <input v-model.number="form.amount" type="number" min="0.001" step="0.01" placeholder="0.5" class="field-input" />
        </div>
      </div>

      <!-- Stop Loss -->
      <div class="sl-section">
        <label class="toggle-row">
          <input type="checkbox" v-model="form.useStopLoss" />
          <span class="section-label stop-loss">Stop Loss</span>
          <span class="section-hint">Auto-sell if price drops below</span>
        </label>
        <div v-if="form.useStopLoss" class="price-row">
          <div class="price-input-wrap">
            <span class="price-prefix">$</span>
            <input v-model.number="form.stopLossPrice" type="number" min="0" step="0.000001" placeholder="0.00001" class="price-input" />
          </div>
          <span class="price-hint">Current: ${{ currentPriceFormatted }}</span>
        </div>
      </div>

      <!-- Take Profit -->
      <div class="sl-section">
        <label class="toggle-row">
          <input type="checkbox" v-model="form.useTakeProfit" />
          <span class="section-label take-profit">Take Profit</span>
          <span class="section-hint">Auto-sell if price rises above</span>
        </label>
        <div v-if="form.useTakeProfit" class="price-row">
          <div class="price-input-wrap">
            <span class="price-prefix">$</span>
            <input v-model.number="form.takeProfitPrice" type="number" min="0" step="0.000001" placeholder="0.001" class="price-input" />
          </div>
          <span class="price-hint">Current: ${{ currentPriceFormatted }}</span>
        </div>
      </div>

      <!-- Quick % buttons -->
      <div class="pct-helpers" v-if="form.useStopLoss || form.useTakeProfit">
        <span class="pct-label">Quick set from current price:</span>
        <div class="pct-row">
          <span class="pct-section">SL:</span>
          <button v-for="p in [-10,-20,-30,-50]" :key="p" class="pct-btn sl" @click="setSlPct(p)">{{ p }}%</button>
          <span class="pct-section" style="margin-left:8px">TP:</span>
          <button v-for="p in [25,50,100,200]" :key="p" class="pct-btn tp" @click="setTpPct(p)">+{{ p }}%</button>
        </div>
      </div>

      <button class="submit-btn" :disabled="!canSubmit || saving" @click="saveOrder">
        <span v-if="saving">Saving...</span>
        <span v-else-if="!connected">Connect Wallet</span>
        <span v-else>Set Order</span>
      </button>
      <div v-if="errorMsg" class="sl-error">{{ errorMsg }}</div>
    </div>

    <!-- Active Orders -->
    <div class="sl-orders" v-if="orders.length">
      <div class="sl-orders-title">Active Orders</div>
      <div v-for="o in orders" :key="o._id" class="sl-order-row">
        <div class="order-info">
          <span class="order-mint">{{ o.mint?.slice(0,6) }}...{{ o.mint?.slice(-4) }}</span>
          <div class="order-tags">
            <span v-if="o.stopLossPrice" class="tag sl">SL ${{ o.stopLossPrice }}</span>
            <span v-if="o.takeProfitPrice" class="tag tp">TP ${{ o.takeProfitPrice }}</span>
          </div>
        </div>
        <span :class="['order-status', o.status]">{{ o.status }}</span>
        <button class="cancel-btn" @click="cancelOrder(o._id)">✕</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../config/api';
import { useStore } from 'vuex';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import { useDexScreener } from '../../composables/useDexScreener';
import { useToast } from '../../composables/useToast';

export default {
  name: 'StopLossPanel',
  props: {
    tokenMint: { type: String, default: '' },
    currentPrice: { type: Number, default: 0 },
  },
  setup(props) {
    const store = useStore();
    const { connected, publicKey } = useSolanaWallet();
    const { show } = useToast();

    const form = ref({
      mint: props.tokenMint,
      amount: 0.5,
      useStopLoss: true,
      useTakeProfit: false,
      stopLossPrice: 0,
      takeProfitPrice: 0,
    });
    const orders = ref([]);
    const saving = ref(false);
    const errorMsg = ref('');

    const currentPriceFormatted = computed(() => {
      const p = props.currentPrice;
      if (!p) return '—';
      if (p < 0.000001) return p.toExponential(3);
      if (p < 0.01) return p.toFixed(8);
      return p.toFixed(6);
    });

    const canSubmit = computed(() =>
      connected.value && form.value.mint && form.value.amount > 0 &&
      (form.value.useStopLoss || form.value.useTakeProfit)
    );

    function setSlPct(pct) {
      if (!props.currentPrice) return;
      form.value.stopLossPrice = +(props.currentPrice * (1 + pct / 100)).toPrecision(6);
    }
    function setTpPct(pct) {
      if (!props.currentPrice) return;
      form.value.takeProfitPrice = +(props.currentPrice * (1 + pct / 100)).toPrecision(6);
    }

    async function loadOrders() {
      try {
        const { data } = await api.get('/api/orders?type=sl_tp');
        orders.value = (data || []).filter(o => o.type === 'sl_tp');
      } catch { orders.value = []; }
    }

    async function saveOrder() {
      if (!canSubmit.value) return;
      saving.value = true; errorMsg.value = '';
      try {
        await api.post('/api/orders', {
          type: 'sl_tp',
          symbol: form.value.mint,
          amount: form.value.amount,
          stopLossPrice: form.value.useStopLoss ? form.value.stopLossPrice : null,
          takeProfitPrice: form.value.useTakeProfit ? form.value.takeProfitPrice : null,
        });
        show({ message: 'Order set! Monitoring price...', type: 'success' });
        await loadOrders();
      } catch (e) {
        errorMsg.value = e.response?.data?.error || e.message;
        show({ message: `Failed: ${errorMsg.value}`, type: 'error' });
      } finally { saving.value = false; }
    }

    async function cancelOrder(id) {
      try {
        await api.patch(`/api/orders/${id}/cancel`, {});
        await loadOrders();
        show({ message: 'Order cancelled', type: 'info' });
      } catch (e) {
        show({ message: e.message, type: 'error' });
      }
    }

    watch(() => props.tokenMint, (v) => { if (v) form.value.mint = v; });
    onMounted(() => { if (connected.value) loadOrders(); });
    watch(connected, (v) => { if (v) loadOrders(); });

    return { form, orders, saving, errorMsg, canSubmit, connected, currentPriceFormatted, setSlPct, setTpPct, saveOrder, cancelOrder };
  },
};
</script>

<style scoped>
.sl-panel { display: flex; flex-direction: column; gap: 12px; }
.sl-form { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.sl-title { font-weight: 700; font-size: 0.88rem; color: #e6edf3; }
.sl-subtitle { font-size: 0.72rem; color: #8b949e; margin-top: -4px; }
.form-row { display: flex; gap: 10px; }
.field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 0.7rem; color: #8b949e; text-transform: uppercase; }
.field-input { background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 7px 9px; color: #e6edf3; font-size: 0.85rem; outline: none; width: 100%; }
.field-input:focus { border-color: #58a6ff; }
.sl-section { background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.toggle-row input[type=checkbox] { accent-color: #58a6ff; width: 14px; height: 14px; }
.section-label { font-weight: 700; font-size: 0.82rem; }
.section-label.stop-loss { color: #f85149; }
.section-label.take-profit { color: #3fb950; }
.section-hint { font-size: 0.7rem; color: #8b949e; margin-left: auto; }
.price-row { display: flex; align-items: center; gap: 10px; }
.price-input-wrap { display: flex; align-items: center; background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 0 8px; flex: 1; }
.price-input-wrap:focus-within { border-color: #58a6ff; }
.price-prefix { color: #8b949e; font-size: 0.85rem; }
.price-input { background: none; border: none; outline: none; color: #e6edf3; font-size: 0.85rem; padding: 7px 4px; flex: 1; width: 0; }
.price-hint { font-size: 0.7rem; color: #8b949e; white-space: nowrap; }
.pct-helpers { background: #21262d; border-radius: 6px; padding: 8px 10px; }
.pct-label { font-size: 0.68rem; color: #8b949e; display: block; margin-bottom: 6px; }
.pct-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.pct-section { font-size: 0.7rem; color: #8b949e; }
.pct-btn { padding: 3px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.72rem; font-weight: 600; }
.pct-btn.sl { background: rgba(248,81,73,0.15); color: #f85149; border: 1px solid rgba(248,81,73,0.3); }
.pct-btn.tp { background: rgba(63,185,80,0.15); color: #3fb950; border: 1px solid rgba(63,185,80,0.3); }
.submit-btn { padding: 11px; background: #1f6feb; border: none; border-radius: 8px; color: #fff; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
.submit-btn:hover:not(:disabled) { background: #388bfd; }
.submit-btn:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
.sl-error { color: #f85149; font-size: 0.75rem; text-align: center; }
.sl-orders { background: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
.sl-orders-title { padding: 8px 12px; font-size: 0.78rem; font-weight: 600; color: #8b949e; text-transform: uppercase; border-bottom: 1px solid #21262d; }
.sl-order-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #21262d; }
.sl-order-row:last-child { border-bottom: none; }
.order-info { flex: 1; }
.order-mint { font-family: monospace; font-size: 0.78rem; color: #58a6ff; display: block; }
.order-tags { display: flex; gap: 5px; margin-top: 3px; }
.tag { font-size: 0.65rem; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
.tag.sl { background: rgba(248,81,73,0.15); color: #f85149; }
.tag.tp { background: rgba(63,185,80,0.15); color: #3fb950; }
.order-status { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; }
.order-status.open { color: #58a6ff; }
.order-status.filled { color: #3fb950; }
.order-status.cancelled { color: #8b949e; }
.cancel-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 3px 7px; cursor: pointer; font-size: 0.72rem; }
.cancel-btn:hover { border-color: #f85149; color: #f85149; }
</style>
