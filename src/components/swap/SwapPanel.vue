<template>
  <div class="swap-panel">
    <div class="swap-header">
      <span class="title">Swap</span>
      <swap-settings />
    </div>

    <!-- Input Token -->
    <div class="token-box">
      <div class="token-box-top">
        <span class="box-label">You Pay</span>
        <span class="balance-hint" v-if="inputBalance">Bal: {{ inputBalance }} <button class="max-btn" @click="setMax">MAX</button></span>
      </div>
      <div class="token-box-main">
        <button class="token-select-btn" @click="openSelector('input')">
          <token-logo :src="inputToken?.logoURI" :symbol="inputToken?.symbol" :size="24" />
          {{ inputToken?.symbol || 'Select' }} <span class="caret">▾</span>
        </button>
        <input v-model="inputAmountLocal" type="number" placeholder="0.00" class="amount-input" @input="onAmountChange" min="0" />
      </div>
    </div>

    <!-- Swap Arrow -->
    <div class="swap-arrow-row">
      <button class="swap-arrow" @click="swapTokens" title="Reverse">⇅</button>
      <span v-if="quoteResult" class="rate-hint">
        1 {{ inputToken?.symbol }} ≈ {{ outRate }} {{ outputToken?.symbol }}
      </span>
    </div>

    <!-- Output Token -->
    <div class="token-box">
      <div class="token-box-top">
        <span class="box-label">You Receive</span>
        <span v-if="priceImpact" :class="['impact', priceImpact > 3 ? 'warn' : '']">Impact: {{ priceImpact.toFixed(2) }}%</span>
      </div>
      <div class="token-box-main">
        <button class="token-select-btn" @click="openSelector('output')">
          <token-logo :src="outputToken?.logoURI" :symbol="outputToken?.symbol" :size="24" />
          {{ outputToken?.symbol || 'Select' }} <span class="caret">▾</span>
        </button>
        <div class="amount-output">{{ outAmount || '—' }}</div>
      </div>
    </div>

    <!-- Quote Info -->
    <div v-if="quoteResult" class="quote-info">
      <div class="qi-row"><span>Min Received</span><span>{{ minReceived }} {{ outputToken?.symbol }}</span></div>
      <div class="qi-row"><span>Route</span><span>{{ routeLabel }}</span></div>
    </div>

    <!-- Action Button -->
    <button
      class="swap-btn"
      :class="{ loading: quoteLoading || swapping }"
      :disabled="!canSwap"
      @click="executeSwap"
    >
      <span v-if="swapping">Swapping...</span>
      <span v-else-if="quoteLoading">Getting Quote...</span>
      <span v-else-if="!connected">Connect Wallet</span>
      <span v-else-if="!inputAmountLocal">Enter Amount</span>
      <span v-else>Swap</span>
    </button>

    <div v-if="errorMsg" class="swap-error">{{ errorMsg }}</div>

    <token-selector v-if="selectorOpen" @select="onTokenSelect" @close="selectorOpen = false" />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useJupiter } from '../../composables/useJupiter';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import { useToast } from '../../composables/useToast';
import SwapSettings from './SwapSettings.vue';
import TokenSelector from './TokenSelector.vue';
import TokenLogo from '../common/TokenLogo.vue';

export default {
  components: { SwapSettings, TokenSelector, TokenLogo },
  setup() {
    const store = useStore();
    const { getQuote, ultraOrder, ultraExecute, uiToLamports, lamportsToUi } = useJupiter();
    const { connected, publicKey, signTransactionBase64 } = useSolanaWallet();
    const { show } = useToast();

    const inputAmountLocal = ref('');
    const selectorOpen = ref(false);
    const selectorTarget = ref('input');
    const errorMsg = ref('');
    const swapping = ref(false);
    const quoteLoading = ref(false);
    const quoteResult = ref(null);

    const inputMint = computed(() => store.getters['trading/inputMint']);
    const outputMint = computed(() => store.getters['trading/outputMint']);
    const slippage = computed(() => store.getters['trading/slippage']);
    const useJito = computed(() => store.getters['trading/useJito']);

    const tokenMap = computed(() => store.getters['tokens/getByMint']);
    const inputToken = computed(() => tokenMap.value(inputMint.value));
    const outputToken = computed(() => tokenMap.value(outputMint.value));

    const walletTokens = computed(() => store.getters['wallet/tokens']);
    const inputBalance = computed(() => {
      const t = walletTokens.value.find(wt => wt.mint === inputMint.value);
      return t ? t.amount.toFixed(4) : null;
    });

    const outAmount = computed(() => {
      if (!quoteResult.value || !outputToken.value) return '';
      const raw = parseInt(quoteResult.value.outAmount);
      return lamportsToUi(raw, outputToken.value.decimals || 6).toFixed(6);
    });

    const minReceived = computed(() => {
      if (!quoteResult.value || !outputToken.value) return '';
      const raw = parseInt(quoteResult.value.otherAmountThreshold);
      return lamportsToUi(raw, outputToken.value.decimals || 6).toFixed(6);
    });

    const priceImpact = computed(() => quoteResult.value ? parseFloat(quoteResult.value.priceImpactPct || 0) * 100 : 0);
    const outRate = computed(() => {
      if (!quoteResult.value || !inputAmountLocal.value) return '—';
      const out = parseFloat(outAmount.value);
      return (out / parseFloat(inputAmountLocal.value)).toFixed(4);
    });
    const routeLabel = computed(() => {
      const plan = quoteResult.value?.routePlan;
      if (!plan?.length) return '—';
      return plan.map(s => s.swapInfo?.label || 'DEX').join(' → ');
    });

    const canSwap = computed(() => connected.value && inputAmountLocal.value && quoteResult.value && !swapping.value && !quoteLoading.value);

    let quoteTimer = null;
    async function onAmountChange() {
      clearTimeout(quoteTimer);
      quoteResult.value = null; errorMsg.value = '';
      if (!inputAmountLocal.value || parseFloat(inputAmountLocal.value) <= 0) return;
      quoteTimer = setTimeout(fetchQuote, 500);
    }

    async function fetchQuote() {
      if (!inputToken.value || !outputToken.value) return;
      quoteLoading.value = true;
      const amount = uiToLamports(inputAmountLocal.value, inputToken.value.decimals || 9);
      const slippageBps = Math.round(slippage.value * 100);
      quoteResult.value = await getQuote({ inputMint: inputMint.value, outputMint: outputMint.value, amount, slippageBps });
      quoteLoading.value = false;
    }

    async function executeSwap() {
      if (!canSwap.value) { if (!connected.value) show({ message: 'Please connect your wallet', type: 'warning' }); return; }
      swapping.value = true; errorMsg.value = '';
      try {
        const amount = uiToLamports(inputAmountLocal.value, inputToken.value.decimals || 9);
        const order = await ultraOrder({ inputMint: inputMint.value, outputMint: outputMint.value, amount, taker: publicKey.value });
        if (!order?.transaction) throw new Error('Failed to build Ultra order');
        const signedTx = await signTransactionBase64(order.transaction);
        const result = await ultraExecute({ signedTransaction: signedTx, requestId: order.requestId });
        if (!result || result.status !== 'Success') throw new Error(result?.error || 'Swap failed');
        const txid = result.signature;
        show({ message: `Swap successful! TX: ${txid.slice(0, 8)}...`, type: 'success' });
        store.commit('trading/ADD_ORDER', { inputMint: inputMint.value, outputMint: outputMint.value, inputAmount: inputAmountLocal.value, outAmount: outAmount.value, txid, timestamp: Date.now() });
        inputAmountLocal.value = ''; quoteResult.value = null;
      } catch (e) {
        errorMsg.value = e.message;
        show({ message: `Swap failed: ${e.message}`, type: 'error' });
      } finally { swapping.value = false; }
    }

    function swapTokens() { store.commit('trading/SWAP_TOKENS'); quoteResult.value = null; }
    function openSelector(target) { selectorTarget.value = target; selectorOpen.value = true; }
    function onTokenSelect(token) {
      if (selectorTarget.value === 'input') store.commit('trading/SET_INPUT_MINT', token.address);
      else store.commit('trading/SET_OUTPUT_MINT', token.address);
      store.commit('tokens/CACHE_TOKEN', token);
      quoteResult.value = null;
      if (inputAmountLocal.value) onAmountChange();
    }
    function setMax() {
      const bal = inputBalance.value;
      if (bal) { inputAmountLocal.value = bal; onAmountChange(); }
    }

    watch([inputMint, outputMint], () => { if (inputAmountLocal.value) fetchQuote(); });

    return { inputAmountLocal, selectorOpen, errorMsg, swapping, quoteLoading, quoteResult,
      inputToken, outputToken, inputBalance, outAmount, minReceived, priceImpact, outRate, routeLabel,
      connected, canSwap, onAmountChange, executeSwap, swapTokens, openSelector, onTokenSelect, setMax };
  },
};
</script>

<style scoped>
.swap-panel { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.swap-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.title { font-weight: 700; font-size: 1rem; color: #e6edf3; }
.token-box { background: #21262d; border: 1px solid #30363d; border-radius: 8px; padding: 10px 12px; }
.token-box:focus-within { border-color: #58a6ff; }
.token-box-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.72rem; color: #8b949e; }
.max-btn { background: rgba(88,166,255,0.15); border: none; color: #58a6ff; border-radius: 3px; padding: 1px 5px; cursor: pointer; font-size: 0.7rem; margin-left: 4px; }
.token-box-main { display: flex; align-items: center; gap: 8px; }
.token-select-btn { display: flex; align-items: center; gap: 6px; background: #30363d; border: none; color: #e6edf3; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-weight: 600; font-size: 0.85rem; white-space: nowrap; }
.token-select-btn:hover { background: #3d444d; }
.caret { color: #8b949e; font-size: 0.7rem; }
.amount-input { flex: 1; background: none; border: none; color: #e6edf3; font-size: 1.2rem; font-weight: 600; text-align: right; outline: none; min-width: 0; }
.amount-input::placeholder { color: #3d444d; }
.amount-output { flex: 1; font-size: 1.2rem; font-weight: 600; color: #e6edf3; text-align: right; }
.swap-arrow-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin: -4px 0; position: relative; z-index: 1; }
.swap-arrow { background: #21262d; border: 2px solid #30363d; color: #8b949e; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
.swap-arrow:hover { border-color: #58a6ff; color: #58a6ff; }
.rate-hint { font-size: 0.72rem; color: #8b949e; }
.impact { font-size: 0.72rem; color: #d29922; }
.impact.warn { color: #f85149; }
.quote-info { background: #0d1117; border-radius: 6px; padding: 8px 10px; font-size: 0.75rem; display: flex; flex-direction: column; gap: 4px; }
.qi-row { display: flex; justify-content: space-between; color: #8b949e; }
.qi-row span:last-child { color: #e6edf3; }
.swap-btn { padding: 13px; background: #238636; border: none; color: #fff; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.swap-btn:hover:not(:disabled) { background: #2ea043; }
.swap-btn:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
.swap-btn.loading { background: #1a3020; }
.swap-error { color: #f85149; font-size: 0.78rem; text-align: center; }
</style>
