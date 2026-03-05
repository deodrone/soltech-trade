<template>
  <div class="token-page">
    <div v-if="loading" class="loading">Loading token data...</div>
    <div v-else-if="!tokenData" class="error">Token not found for mint: {{ mint }}</div>

    <template v-else>
      <div class="token-header">
        <div class="th-left">
          <token-logo :src="tokenData.logoURI || tokenData.image" :symbol="tokenData.symbol" :size="48" />
          <div class="th-names">
            <h1>{{ tokenData.name }}</h1>
            <span class="th-symbol">{{ tokenData.symbol }}</span>
            <span class="th-mint">{{ mint }}</span>
          </div>
        </div>
        <div class="th-right">
          <div class="th-price">${{ currentPrice }}</div>
          <price-change :value="change24h" class="th-change" />
          <button class="trade-btn" @click="goTrade">Trade ↗</button>
        </div>
      </div>

      <token-stats-bar
        :price="currentPrice"
        :change24h="change24h"
        :vol24h="pairData?.volume?.h24 || 0"
        :liquidity="pairData?.liquidity?.usd || 0"
        :mcap="pairData?.marketCap || 0"
        :fdv="pairData?.fdv || 0"
      />

      <div class="token-layout">
        <div class="token-main">
          <trading-chart :token-mint="mint" />
        </div>
        <div class="token-side">
          <div class="info-card">
            <div class="info-title">Token Info</div>
            <div class="info-row"><span class="ik">Symbol</span><span class="iv">{{ tokenData.symbol }}</span></div>
            <div class="info-row"><span class="ik">Decimals</span><span class="iv">{{ tokenData.decimals }}</span></div>
            <div class="info-row">
              <span class="ik">Mint</span>
              <a :href="`https://solscan.io/token/${mint}`" target="_blank" class="mint-link">{{ mint.slice(0,12) }}... ↗</a>
            </div>
            <div class="info-row" v-if="pairData?.pairAddress">
              <span class="ik">Pair</span>
              <a :href="`https://solscan.io/account/${pairData.pairAddress}`" target="_blank" class="mint-link">{{ pairData.pairAddress.slice(0,12) }}... ↗</a>
            </div>
          </div>
          <token-safety :token-mint="mint" />
          <holder-distribution :token-mint="mint" />
          <swap-panel />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDexScreener } from '../composables/useDexScreener';
import { useJupiter } from '../composables/useJupiter';
import TradingChart from '../components/charts/TradingChart.vue';
import SwapPanel from '../components/swap/SwapPanel.vue';
import TokenLogo from '../components/common/TokenLogo.vue';
import PriceChange from '../components/common/PriceChange.vue';
import TokenStatsBar from '../components/common/TokenStatsBar.vue';
import TokenSafety from '../components/token/TokenSafety.vue';
import HolderDistribution from '../components/token/HolderDistribution.vue';

export default {
  components: { TradingChart, SwapPanel, TokenLogo, PriceChange, TokenStatsBar, TokenSafety, HolderDistribution },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const { getTokenPairs } = useDexScreener();
    const { getTokenList } = useJupiter();

    const mint = computed(() => route.params.mint);
    const loading = ref(true);
    const tokenData = ref(null);
    const pairData = ref(null);

    const currentPrice = computed(() => {
      const p = pairData.value ? parseFloat(pairData.value.priceUsd || 0) : 0;
      return p < 0.001 ? p.toExponential(3) : p.toFixed(p < 1 ? 6 : 2);
    });
    const change24h = computed(() => pairData.value?.priceChange?.h24 || 0);

    async function goTrade() {
      store.commit('trading/SET_INPUT_MINT', mint.value);
      router.push('/trade');
    }

    watch([tokenData], () => {
      if (tokenData.value?.name) {
        document.title = `${tokenData.value.symbol} — Soltech Trade`;
      }
    });

    onMounted(async () => {
      loading.value = true;
      const [list, pairs] = await Promise.all([
        getTokenList(),
        getTokenPairs(mint.value),
      ]);
      tokenData.value = list.find(t => t.address === mint.value) || { symbol: mint.value.slice(0,6), name: 'Unknown Token', decimals: 6 };
      if (pairs.length) pairData.value = pairs[0];
      loading.value = false;
    });

    return { mint, loading, tokenData, pairData, currentPrice, change24h, goTrade };
  }
};
</script>

<style scoped>
.token-page { background: #0d1117; min-height: calc(100vh - 48px); }
.loading, .error { padding: 60px; text-align: center; color: #8b949e; }
.token-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; }
.th-left { display: flex; align-items: center; gap: 12px; }
.th-names h1 { margin: 0 0 2px; color: #e6edf3; font-size: 1.4rem; }
.th-symbol { font-size: 0.85rem; color: #8b949e; margin-right: 8px; }
.th-mint { font-size: 0.68rem; color: #8b949e; font-family: monospace; }
.th-right { display: flex; align-items: center; gap: 12px; }
.th-price { font-size: 1.6rem; font-weight: 700; color: #e6edf3; font-family: monospace; }
.th-change { font-size: 1rem; }
.trade-btn { padding: 8px 20px; background: #1f6feb; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 600; }
.token-layout { display: grid; grid-template-columns: 1fr 300px; gap: 0; }
.token-main { border-right: 1px solid #21262d; }
.token-side { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 900px) {
  .token-layout { grid-template-columns: 1fr; }
  .token-main { border-right: none; border-bottom: 1px solid #21262d; }
  .token-header { flex-wrap: wrap; gap: 12px; }
  .th-right { flex-wrap: wrap; }
}
.info-card { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 12px; }
.info-title { font-size: 0.8rem; font-weight: 600; color: #8b949e; text-transform: uppercase; margin-bottom: 8px; }
.info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #21262d; font-size: 0.8rem; }
.ik { color: #8b949e; }
.iv { color: #e6edf3; font-family: monospace; }
.mint-link { color: #58a6ff; text-decoration: none; font-family: monospace; font-size: 0.78rem; }
</style>
