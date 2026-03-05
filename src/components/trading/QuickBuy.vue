<template>
  <div class="quick-buy">
    <div class="qb-header">
      <span class="qb-title">Quick Buy</span>
      <span class="qb-token">{{ symbol || 'Token' }}</span>
    </div>

    <!-- Preset amounts -->
    <div class="preset-row">
      <button
        v-for="p in presets"
        :key="p"
        :class="['preset-btn', { active: selected === p }]"
        @click="selectPreset(p)"
      >{{ p }} SOL</button>
    </div>

    <!-- Custom amount -->
    <div class="custom-row">
      <input
        v-model="customAmount"
        type="number"
        placeholder="Custom SOL"
        class="custom-input"
        min="0.001"
        step="0.01"
        @focus="selected = null"
        @input="onCustom"
      />
      <span class="sol-label">SOL</span>
    </div>

    <!-- Slippage quick-set -->
    <div class="slip-row">
      <span class="slip-label">Slippage</span>
      <div class="slip-btns">
        <button
          v-for="s in [0.5, 1, 3, 10]"
          :key="s"
          :class="['slip-btn', { active: slippage === s }]"
          @click="slippage = s"
        >{{ s }}%</button>
      </div>
    </div>

    <button
      class="buy-btn"
      :disabled="!finalAmount || !connected || buying"
      @click="executeBuy"
    >
      <span v-if="buying">Buying...</span>
      <span v-else-if="!connected">Connect Wallet</span>
      <span v-else>Buy {{ finalAmount || '—' }} SOL → {{ symbol }}</span>
    </button>

    <div v-if="errorMsg" class="qb-error">{{ errorMsg }}</div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useJupiter } from '../../composables/useJupiter';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import { useToast } from '../../composables/useToast';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default {
  name: 'QuickBuy',
  props: {
    outputMint: { type: String, required: true },
    symbol:     { type: String, default: 'Token' },
  },
  emits: ['bought'],
  setup(props, { emit }) {
    const store = useStore();
    const { getQuote, getSwapTransaction, uiToLamports } = useJupiter();
    const { connected, publicKey, signAndSendTransaction } = useSolanaWallet();
    const { show } = useToast();

    const presets   = [0.1, 0.5, 1, 5];
    const selected  = ref(null);
    const customAmount = ref('');
    const slippage  = ref(1);
    const buying    = ref(false);
    const errorMsg  = ref('');

    const finalAmount = computed(() => {
      if (selected.value) return selected.value;
      return customAmount.value ? parseFloat(customAmount.value) : null;
    });

    function selectPreset(p) {
      selected.value = p;
      customAmount.value = '';
    }
    function onCustom() { selected.value = null; }

    async function executeBuy() {
      if (!finalAmount.value || !connected.value) return;
      buying.value = true;
      errorMsg.value = '';
      try {
        const amount = uiToLamports(finalAmount.value, 9); // SOL = 9 decimals
        const slippageBps = Math.round(slippage.value * 100);
        const quote = await getQuote({
          inputMint: SOL_MINT,
          outputMint: props.outputMint,
          amount,
          slippageBps,
        });
        if (!quote) throw new Error('Failed to get quote');
        const tx = await getSwapTransaction({ quoteResponse: quote, userPublicKey: publicKey.value, useJito: true });
        if (!tx) throw new Error('Failed to build transaction');
        const txid = await signAndSendTransaction(tx);
        show({ message: `Bought ${props.symbol}! TX: ${txid.slice(0, 8)}...`, type: 'success' });
        store.commit('trading/ADD_ORDER', {
          inputMint: SOL_MINT,
          outputMint: props.outputMint,
          inputAmount: finalAmount.value,
          txid,
          timestamp: Date.now(),
        });
        emit('bought', { txid, amount: finalAmount.value });
      } catch (e) {
        errorMsg.value = e.message;
        show({ message: `Buy failed: ${e.message}`, type: 'error' });
      } finally { buying.value = false; }
    }

    return { presets, selected, customAmount, slippage, buying, errorMsg, finalAmount, connected, selectPreset, onCustom, executeBuy };
  },
};
</script>

<style scoped>
.quick-buy { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.qb-header { display: flex; justify-content: space-between; align-items: center; }
.qb-title { font-weight: 700; font-size: 0.9rem; color: #e6edf3; }
.qb-token { font-size: 0.78rem; color: #58a6ff; font-weight: 600; }
.preset-row { display: flex; gap: 6px; }
.preset-btn { flex: 1; padding: 7px 4px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.12s; }
.preset-btn:hover { border-color: #3fb950; color: #3fb950; }
.preset-btn.active { border-color: #3fb950; color: #3fb950; background: rgba(63,185,80,0.12); }
.custom-row { display: flex; align-items: center; background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 0 10px; }
.custom-row:focus-within { border-color: #58a6ff; }
.custom-input { flex: 1; background: none; border: none; color: #e6edf3; font-size: 0.9rem; padding: 8px 0; outline: none; }
.sol-label { color: #8b949e; font-size: 0.8rem; }
.slip-row { display: flex; align-items: center; gap: 8px; }
.slip-label { font-size: 0.72rem; color: #8b949e; white-space: nowrap; }
.slip-btns { display: flex; gap: 4px; }
.slip-btn { padding: 3px 8px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #8b949e; cursor: pointer; font-size: 0.72rem; }
.slip-btn.active { border-color: #d29922; color: #d29922; background: rgba(210,153,34,0.1); }
.buy-btn { padding: 11px; background: #3fb950; border: none; border-radius: 8px; color: #fff; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.buy-btn:hover:not(:disabled) { background: #46c957; }
.buy-btn:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
.qb-error { color: #f85149; font-size: 0.75rem; text-align: center; }
</style>
