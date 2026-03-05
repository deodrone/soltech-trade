<template>
  <div class="dca-panel">
    <!-- Create DCA -->
    <div class="dca-form">
      <div class="dca-form-title">Create DCA Order</div>

      <div class="form-row">
        <div class="field">
          <label>Spend Per Cycle</label>
          <div class="input-wrap">
            <input v-model.number="form.inAmountPerCycle" type="number" min="0.001" step="0.01" placeholder="0.1" class="field-input" />
            <span class="field-suffix">SOL</span>
          </div>
        </div>
        <div class="field">
          <label>Total Cycles</label>
          <input v-model.number="form.cycles" type="number" min="1" max="100" placeholder="10" class="field-input" />
        </div>
      </div>

      <div class="form-row">
        <div class="field full">
          <label>Interval</label>
          <div class="cycle-options">
            <button
              v-for="opt in CYCLE_OPTIONS"
              :key="opt.value"
              :class="['cycle-btn', { active: form.cycleSecondsApart === opt.value }]"
              @click="form.cycleSecondsApart = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Min Price (optional)</label>
          <div class="input-wrap">
            <input v-model.number="form.minOutPerCycle" type="number" min="0" placeholder="0" class="field-input" />
            <span class="field-suffix">{{ outputSymbol }}</span>
          </div>
        </div>
        <div class="field">
          <label>Max Price (optional)</label>
          <div class="input-wrap">
            <input v-model.number="form.maxOutPerCycle" type="number" min="0" placeholder="∞" class="field-input" />
            <span class="field-suffix">{{ outputSymbol }}</span>
          </div>
        </div>
      </div>

      <div class="dca-summary" v-if="form.inAmountPerCycle && form.cycles">
        Total: <strong>{{ (form.inAmountPerCycle * form.cycles).toFixed(3) }} SOL</strong>
        over <strong>{{ totalDuration }}</strong> (~{{ form.cycles }} buys)
      </div>

      <button class="create-btn" :disabled="!canCreate || creating" @click="createDCA">
        <span v-if="creating">Creating...</span>
        <span v-else-if="!connected">Connect Wallet</span>
        <span v-else>Start DCA</span>
      </button>

      <div v-if="errorMsg" class="dca-error">{{ errorMsg }}</div>
    </div>

    <!-- Active DCA Orders -->
    <div class="dca-orders" v-if="orders.length">
      <div class="dca-orders-title">Active DCA Orders</div>
      <div v-for="o in orders" :key="o.dcaAddress" class="dca-order-row">
        <div class="order-info">
          <span class="order-pair">{{ o.inputMint?.slice(0,4) }}→{{ o.outputMint?.slice(0,4) }}</span>
          <span class="order-detail">{{ o.inAmountPerCycle }} / {{ cycleLabel(o.cycleSecondsApart) }}</span>
        </div>
        <div class="order-progress">
          <span class="order-fills">{{ o.numberOfFills || 0 }} fills</span>
        </div>
        <button class="cancel-btn" @click="cancelDCA(o.dcaAddress)" :disabled="cancelling === o.dcaAddress">✕</button>
      </div>
    </div>
    <div v-else-if="connected" class="dca-empty">No active DCA orders</div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useDCA } from '../../composables/useDCA';
import { useJupiter } from '../../composables/useJupiter';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import { useToast } from '../../composables/useToast';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default {
  name: 'DcaPanel',
  props: {
    outputMint:   { type: String, required: true },
    outputSymbol: { type: String, default: 'Token' },
  },
  setup(props) {
    const store = useStore();
    const { getDCAOrders, createDCATransaction, closeDCATransaction, cycleLabel, CYCLE_OPTIONS } = useDCA();
    const { uiToLamports } = useJupiter();
    const { connected, publicKey, signAndSendTransaction } = useSolanaWallet();
    const { show } = useToast();

    const form = ref({ inAmountPerCycle: 0.1, cycles: 10, cycleSecondsApart: 3600, minOutPerCycle: 0, maxOutPerCycle: 0 });
    const orders = ref([]);
    const creating = ref(false);
    const cancelling = ref(null);
    const errorMsg = ref('');

    const canCreate = computed(() => connected.value && form.value.inAmountPerCycle > 0 && form.value.cycles > 0);

    const totalDuration = computed(() => {
      const secs = form.value.cycles * form.value.cycleSecondsApart;
      if (secs < 3600) return `${Math.round(secs / 60)} min`;
      if (secs < 86400) return `${(secs / 3600).toFixed(1)} hr`;
      return `${(secs / 86400).toFixed(1)} days`;
    });

    async function loadOrders() {
      if (!publicKey.value) return;
      orders.value = await getDCAOrders(publicKey.value);
    }

    async function createDCA() {
      if (!canCreate.value) return;
      creating.value = true; errorMsg.value = '';
      try {
        const perCycle = uiToLamports(form.value.inAmountPerCycle, 9);
        const total    = perCycle * form.value.cycles;
        const result = await createDCATransaction({
          userPublicKey: publicKey.value,
          inputMint: SOL_MINT,
          outputMint: props.outputMint,
          totalInAmount: total,
          inAmountPerCycle: perCycle,
          cycleSecondsApart: form.value.cycleSecondsApart,
          minOutAmountPerCycle: form.value.minOutPerCycle ? uiToLamports(form.value.minOutPerCycle, 6) : 0,
          maxOutAmountPerCycle: form.value.maxOutPerCycle ? uiToLamports(form.value.maxOutPerCycle, 6) : 0,
        });
        await signAndSendTransaction(result.tx);
        show({ message: 'DCA order created!', type: 'success' });
        await loadOrders();
      } catch (e) {
        errorMsg.value = e.message;
        show({ message: `DCA failed: ${e.message}`, type: 'error' });
      } finally { creating.value = false; }
    }

    async function cancelDCA(dcaAddress) {
      cancelling.value = dcaAddress;
      try {
        const result = await closeDCATransaction({ userPublicKey: publicKey.value, dcaAddress });
        await signAndSendTransaction(result.tx);
        show({ message: 'DCA order cancelled', type: 'info' });
        await loadOrders();
      } catch (e) {
        show({ message: `Cancel failed: ${e.message}`, type: 'error' });
      } finally { cancelling.value = null; }
    }

    onMounted(loadOrders);
    watch(connected, (v) => { if (v) loadOrders(); });

    return { form, orders, creating, cancelling, errorMsg, canCreate, totalDuration, connected, CYCLE_OPTIONS, cycleLabel, createDCA, cancelDCA };
  },
};
</script>

<style scoped>
.dca-panel { display: flex; flex-direction: column; gap: 12px; }
.dca-form { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.dca-form-title { font-weight: 700; font-size: 0.88rem; color: #e6edf3; }
.form-row { display: flex; gap: 10px; }
.field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.field.full { flex: 1 1 100%; }
.field label { font-size: 0.7rem; color: #8b949e; text-transform: uppercase; }
.input-wrap { display: flex; align-items: center; background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 0 8px; }
.input-wrap:focus-within { border-color: #58a6ff; }
.field-input { background: transparent; border: none; outline: none; color: #e6edf3; font-size: 0.85rem; padding: 7px 0; flex: 1; width: 0; }
.field-input:not(.input-wrap > .field-input) { background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 7px 8px; width: 100%; }
.field-suffix { font-size: 0.72rem; color: #8b949e; white-space: nowrap; }
.cycle-options { display: flex; flex-wrap: wrap; gap: 5px; }
.cycle-btn { padding: 4px 10px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #8b949e; cursor: pointer; font-size: 0.75rem; }
.cycle-btn.active { border-color: #58a6ff; color: #58a6ff; background: rgba(88,166,255,0.1); }
.dca-summary { font-size: 0.78rem; color: #8b949e; background: #21262d; border-radius: 6px; padding: 8px 10px; }
.dca-summary strong { color: #e6edf3; }
.create-btn { padding: 11px; background: #1f6feb; border: none; border-radius: 8px; color: #fff; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
.create-btn:hover:not(:disabled) { background: #388bfd; }
.create-btn:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
.dca-error { color: #f85149; font-size: 0.75rem; text-align: center; }
.dca-orders { background: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
.dca-orders-title { padding: 8px 12px; font-size: 0.78rem; font-weight: 600; color: #8b949e; text-transform: uppercase; border-bottom: 1px solid #21262d; }
.dca-order-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #21262d; }
.dca-order-row:last-child { border-bottom: none; }
.order-info { flex: 1; }
.order-pair { font-family: monospace; font-size: 0.8rem; color: #58a6ff; display: block; }
.order-detail { font-size: 0.7rem; color: #8b949e; }
.order-fills { font-size: 0.72rem; color: #3fb950; }
.cancel-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 3px 7px; cursor: pointer; font-size: 0.75rem; }
.cancel-btn:hover { border-color: #f85149; color: #f85149; }
.dca-empty { text-align: center; color: #8b949e; font-size: 0.78rem; padding: 12px; }
</style>
