<template>
  <div class="terminal">
    <!-- Token Stats Bar -->
    <div class="token-bar">
      <div class="token-bar-left">
        <token-logo :src="selectedTokenInfo?.logoURI" :symbol="selectedTokenInfo?.symbol" :size="28" />
        <div class="token-pair">
          <span class="pair-name">{{ selectedTokenInfo?.symbol || 'SOL' }}/USDC</span>
          <span class="pair-addr" v-if="selectedMint">{{ selectedMint.slice(0,8) }}...</span>
        </div>
        <div class="divider" />
        <div class="stat"><span class="sl">Price</span><span class="sv">${{ currentPrice }}</span></div>
        <price-change :value="priceChange24h" />
        <div class="divider" />
        <div class="stat"><span class="sl">Vol 24h</span><span class="sv">{{ vol24h }}</span></div>
        <div class="stat"><span class="sl">Liq</span><span class="sv">{{ liquidity }}</span></div>
        <div class="stat"><span class="sl">MCap</span><span class="sv">{{ mcap }}</span></div>
        <div class="stat"><span class="sl">FDV</span><span class="sv">{{ fdv }}</span></div>
        <div class="stat"><span class="sl">Buys</span><span class="sv green">{{ buys }}</span></div>
        <div class="stat"><span class="sl">Sells</span><span class="sv red">{{ sells }}</span></div>
      </div>
      <div class="token-bar-right">
        <input v-model="searchQuery" placeholder="🔍 Search token..." class="token-search" @keydown.enter="doSearch" />
      </div>
    </div>

    <!-- Main Layout -->
    <div class="terminal-body">
      <div class="chart-section">
        <trading-chart :token-mint="selectedMint" />
      </div>
      <div class="swap-section">
        <div class="order-tabs">
          <button :class="['otab', { active: swapTab === 'swap' }]"    @click="swapTab = 'swap'">Swap</button>
          <button :class="['otab', { active: swapTab === 'quickbuy' }]" @click="swapTab = 'quickbuy'">Quick Buy</button>
          <button :class="['otab', { active: swapTab === 'dca' }]"     @click="swapTab = 'dca'">DCA</button>
          <button :class="['otab', { active: swapTab === 'sl' }]"      @click="swapTab = 'sl'">SL/TP</button>
        </div>
        <swap-panel v-if="swapTab === 'swap'" />
        <quick-buy v-if="swapTab === 'quickbuy'" :output-mint="selectedMint" :symbol="selectedTokenInfo?.symbol" @bought="onBought" />
        <premium-gate v-if="swapTab === 'dca'" description="DCA recurring orders require Soltech Premium or holding $SOLTECH.">
          <dca-panel :output-mint="selectedMint" :output-symbol="selectedTokenInfo?.symbol" />
        </premium-gate>
        <premium-gate v-if="swapTab === 'sl'" description="Stop Loss / Take Profit requires Soltech Premium or holding $SOLTECH.">
          <stop-loss-panel :token-mint="selectedMint" :current-price="parseFloat(currentPrice) || 0" />
        </premium-gate>

        <div class="order-tabs" style="margin-top:8px">
          <button :class="['otab', { active: orderTab === 'limit' }]"   @click="orderTab = 'limit'">Limit</button>
          <button :class="['otab', { active: orderTab === 'history' }]" @click="orderTab = 'history'">History</button>
        </div>

        <!-- Limit orders -->
        <div v-if="orderTab === 'limit'" class="limit-orders">
          <div v-if="loadingLimit" class="no-orders">Loading...</div>
          <div v-else-if="!limitOrders.length" class="no-orders">No open limit orders</div>
          <div v-for="o in limitOrders" :key="o.publicKey" class="order-row">
            <div class="order-row-inner">
              <span class="order-pair-label">{{ o.account?.inputMintLabel || o.account?.inputMint?.slice(0,4) }} → {{ o.account?.outputMintLabel || o.account?.outputMint?.slice(0,4) }}</span>
              <span class="order-amt">{{ fmtLamports(o.account?.inAmount) }}</span>
            </div>
            <span class="order-status-pill open">Open</span>
          </div>
        </div>

        <!-- Trade history -->
        <div v-if="orderTab === 'history'" class="order-history">
          <div v-if="!orderHistory.length" class="no-orders">No recent trades</div>
          <div v-for="o in orderHistory" :key="o.txid" class="order-row">
            <div class="order-row-inner">
              <span class="mono">{{ fmtSol(o.inputAmount) }} SOL → {{ o.outAmount ? parseFloat(o.outAmount).toFixed(4) : '—' }}</span>
              <span class="order-age">{{ relTime(o.timestamp) }}</span>
            </div>
            <a :href="`https://solscan.io/tx/${o.txid}`" target="_blank" class="tx-link">↗</a>
          </div>
        </div>
      </div>

      <div class="orderbook-section">
        <order-book :token-mint="selectedMint" />
      </div>
    </div>

    <!-- Bottom Panels -->
    <div class="bottom-panels">
      <div class="bottom-tabs">
        <button :class="['btab', { active: bottomTab === 'trending' }]" @click="bottomTab = 'trending'">🔥 Trending</button>
        <button :class="['btab', { active: bottomTab === 'new' }]" @click="bottomTab = 'new'">🚀 New Launches</button>
        <button :class="['btab', { active: bottomTab === 'sniper' }]" @click="bottomTab = 'sniper'">🎯 Sniper</button>
        <button :class="['btab', { active: bottomTab === 'traders' }]" @click="bottomTab = 'traders'">🐋 Top Traders</button>
        <button :class="['btab', { active: bottomTab === 'alerts' }]" @click="bottomTab = 'alerts'">🔔 Alerts</button>
      </div>
      <div class="bottom-content">
        <trending-tokens v-if="bottomTab === 'trending'" @trade="onTrade" @select="onSelect" />
        <new-launches v-if="bottomTab === 'new'" @trade="onTrade" @select="onSelect" />
        <premium-gate v-if="bottomTab === 'sniper'" description="The Sniper Feed with auto-buy requires Soltech Premium or $SOLTECH tokens.">
          <sniper-feed @trade="onTrade" @select="onSelect" />
        </premium-gate>
        <smart-money v-if="bottomTab === 'traders'" :token-mint="selectedMint" />
        <alert-feed v-if="bottomTab === 'alerts'" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useDexScreener } from '../composables/useDexScreener';
import { useJupiter } from '../composables/useJupiter';
import TradingChart from '../components/charts/TradingChart.vue';
import SwapPanel from '../components/swap/SwapPanel.vue';
import QuickBuy from '../components/trading/QuickBuy.vue';
import DcaPanel from '../components/trading/DcaPanel.vue';
import StopLossPanel from '../components/trading/StopLossPanel.vue';
import OrderBook from '../components/orderbook/OrderBook.vue';
import TrendingTokens from '../components/discovery/TrendingTokens.vue';
import NewLaunches from '../components/discovery/NewLaunches.vue';
import SmartMoney from '../components/analytics/SmartMoney.vue';
import AlertFeed from '../components/alerts/AlertFeed.vue';
import SniperFeed from '../components/discovery/SniperFeed.vue';
import PremiumGate from '../components/monetization/PremiumGate.vue';
import TokenLogo from '../components/common/TokenLogo.vue';
import PriceChange from '../components/common/PriceChange.vue';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default {
  name: 'TradingTerminal',
  components: { TradingChart, SwapPanel, QuickBuy, DcaPanel, StopLossPanel, PremiumGate, OrderBook, TrendingTokens, NewLaunches, SniperFeed, SmartMoney, AlertFeed, TokenLogo, PriceChange },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { getTokenPairs } = useDexScreener();
    const { getTokenList, getLimitOrders, lamportsToUi } = useJupiter();

    const searchQuery = ref('');
    const swapTab = ref('swap');
    const orderTab = ref('history');
    const bottomTab = ref('trending');
    const pairData = ref(null);
    const loadingLimit = ref(false);

    const selectedMint = computed(() => store.getters['trading/inputMint'] || SOL_MINT);
    const selectedTokenInfo = computed(() => store.getters['tokens/getByMint'](selectedMint.value));
    const orderHistory = computed(() => store.state.trading.orderHistory);
    const limitOrders = computed(() => store.state.trading.limitOrders);
    const walletPk = computed(() => store.getters['wallet/publicKey']);

    const fmtLg = v => { if (!v) return '—'; if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`; if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`; return `$${v.toFixed(0)}`; };
    const fmtSol = v => v ? parseFloat(v).toFixed(3) : '—';
    const fmtLamports = v => v ? (parseInt(v) / 1e9).toFixed(4) : '—';
    const relTime = ts => { if (!ts) return ''; const s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s/60)}m`; return `${Math.floor(s/3600)}h`; };

    const currentPrice = computed(() => pairData.value ? parseFloat(pairData.value.priceUsd || 0).toFixed(6) : '—');
    const priceChange24h = computed(() => pairData.value?.priceChange?.h24 || 0);
    const vol24h = computed(() => fmtLg(pairData.value?.volume?.h24));
    const liquidity = computed(() => fmtLg(pairData.value?.liquidity?.usd));
    const mcap = computed(() => fmtLg(pairData.value?.marketCap));
    const fdv = computed(() => fmtLg(pairData.value?.fdv));
    const buys = computed(() => pairData.value?.txns?.h24?.buys || 0);
    const sells = computed(() => pairData.value?.txns?.h24?.sells || 0);

    async function loadPairData() {
      if (!selectedMint.value) return;
      const pairs = await getTokenPairs(selectedMint.value);
      if (pairs.length) pairData.value = pairs[0];
    }

    async function loadLimitOrders() {
      if (!walletPk.value) return;
      loadingLimit.value = true;
      try {
        const orders = await getLimitOrders(walletPk.value);
        store.commit('trading/SET_LIMIT_ORDERS', orders);
      } finally { loadingLimit.value = false; }
    }

    function doSearch() {
      if (!searchQuery.value.trim()) return;
      router.push(`/discover?q=${encodeURIComponent(searchQuery.value)}`);
    }

    function onTrade(token) {
      const mint = token.mint || token.address;
      store.commit('trading/SET_INPUT_MINT', mint);
      loadPairData();
    }

    function onBought() { loadPairData(); }

    function onSelect(token) {
      router.push(`/token/${token.mint || token.address}`);
    }

    let priceTimer = null;

    watch(orderTab, (val) => { if (val === 'limit') loadLimitOrders(); });
    watch(walletPk, (pk) => { if (pk && orderTab.value === 'limit') loadLimitOrders(); });
    watch(selectedMint, () => { loadPairData(); });

    onMounted(async () => {
      // Load token from URL param (e.g. /trade/MINT_ADDRESS)
      if (route.params.token && route.params.token !== SOL_MINT) {
        store.commit('trading/SET_INPUT_MINT', route.params.token);
      }
      const list = await getTokenList();
      store.commit('tokens/SET_TOKEN_LIST', list);
      await loadPairData();
      priceTimer = setInterval(loadPairData, 30000);
    });

    onUnmounted(() => { if (priceTimer) clearInterval(priceTimer); });

    return {
      searchQuery, swapTab, orderTab, bottomTab, selectedMint, selectedTokenInfo,
      orderHistory, limitOrders, loadingLimit,
      currentPrice, priceChange24h, vol24h, liquidity, mcap, fdv, buys, sells,
      fmtSol, fmtLamports, relTime,
      doSearch, onTrade, onSelect, onBought,
    };
  },
};
</script>

<style scoped>
.terminal { display: flex; flex-direction: column; height: calc(100vh - 48px); background: #0d1117; overflow: hidden; }
.token-bar { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #161b22; border-bottom: 1px solid #21262d; gap: 12px; overflow-x: auto; flex-shrink: 0; }
.token-bar-left { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; white-space: nowrap; }
.token-pair { display: flex; flex-direction: column; }
.pair-name { font-weight: 700; font-size: 0.9rem; color: #e6edf3; }
.pair-addr { font-size: 0.65rem; color: #8b949e; font-family: monospace; }
.divider { width: 1px; height: 24px; background: #30363d; flex-shrink: 0; }
.stat { display: flex; flex-direction: column; align-items: center; min-width: 55px; }
.sl { font-size: 0.6rem; color: #8b949e; text-transform: uppercase; }
.sv { font-size: 0.78rem; color: #e6edf3; font-family: monospace; }
.green { color: #3fb950; }
.red { color: #f85149; }
.token-search { padding: 5px 10px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 0.82rem; width: 200px; outline: none; }
.token-search:focus { border-color: #58a6ff; }

/* Desktop 3-col layout */
.terminal-body { display: grid; grid-template-columns: 1fr 280px 200px; flex: 1; min-height: 0; border-bottom: 1px solid #21262d; }
.chart-section { border-right: 1px solid #21262d; overflow: hidden; display: flex; flex-direction: column; }
.swap-section { border-right: 1px solid #21262d; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.orderbook-section { overflow-y: auto; }

.order-tabs { display: flex; border-bottom: 1px solid #21262d; }
.otab { flex: 1; padding: 6px; background: none; border: none; color: #8b949e; cursor: pointer; font-size: 0.75rem; border-bottom: 2px solid transparent; }
.otab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
.no-orders { padding: 12px; text-align: center; color: #8b949e; font-size: 0.75rem; }
.order-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-bottom: 1px solid #21262d; gap: 6px; }
.order-row-inner { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.order-pair-label { font-family: monospace; font-size: 0.72rem; color: #e6edf3; }
.order-amt { font-size: 0.68rem; color: #8b949e; }
.order-age { font-size: 0.68rem; color: #8b949e; }
.mono { font-family: monospace; font-size: 0.72rem; color: #8b949e; }
.order-status-pill { font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
.order-status-pill.open { background: rgba(88,166,255,0.15); color: #58a6ff; }
.tx-link { color: #58a6ff; text-decoration: none; font-size: 0.75rem; flex-shrink: 0; }

.bottom-panels { flex-shrink: 0; height: 260px; border-top: 1px solid #21262d; display: flex; flex-direction: column; }
.bottom-tabs { display: flex; border-bottom: 1px solid #21262d; flex-shrink: 0; overflow-x: auto; }
.btab { padding: 6px 14px; background: none; border: none; color: #8b949e; cursor: pointer; font-size: 0.78rem; border-bottom: 2px solid transparent; white-space: nowrap; }
.btab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
.bottom-content { flex: 1; overflow-y: auto; }

/* Tablet — hide orderbook, shrink swap section */
@media (max-width: 1024px) {
  .terminal-body { grid-template-columns: 1fr 260px; }
  .orderbook-section { display: none; }
}

/* Mobile — stack vertically, show only chart + swap */
@media (max-width: 640px) {
  .terminal { height: auto; overflow: visible; }
  .terminal-body { grid-template-columns: 1fr; height: auto; }
  .chart-section { height: 320px; border-right: none; border-bottom: 1px solid #21262d; }
  .swap-section { border-right: none; }
  .bottom-panels { height: auto; max-height: 340px; }
}
</style>
