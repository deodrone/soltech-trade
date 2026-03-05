<template>
  <div class="portfolio-page">
    <div class="port-header">
      <div>
        <h1>Portfolio</h1>
        <div v-if="connected" class="wallet-addr">{{ shortKey }}</div>
      </div>
      <wallet-connect />
    </div>

    <div v-if="!connected" class="connect-prompt">
      <div class="cp-icon">👛</div>
      <div class="cp-title">Connect your wallet to view portfolio</div>
      <wallet-connect />
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-cards">
        <stat-card label="Total Value" :value="'$' + portfolio.totalUsd.toFixed(2)" />
        <stat-card label="SOL Balance" :value="portfolio.solBalance.toFixed(4) + ' SOL'" />
        <stat-card label="Tokens" :value="String(portfolio.tokens.length)" />
      </div>

      <!-- Holdings Table -->
      <div class="section">
        <div class="section-title">Holdings</div>
        <div v-if="loading" class="loading">Loading...</div>
        <div v-else class="holdings-table">
          <div class="ht-header"><span>Token</span><span>Balance</span><span>Price</span><span>Value</span><span>Alloc%</span><span></span></div>
          <div v-for="t in portfolio.tokens" :key="t.mint" class="ht-row">
            <div class="token-cell">
              <token-logo :src="t.logo" :symbol="t.symbol" :size="28" />
              <div>
                <span class="sym">{{ t.symbol }}</span>
                <span class="nm">{{ truncate(t.name, 14) }}</span>
              </div>
            </div>
            <span class="mono">{{ t.amount.toFixed(4) }}</span>
            <span class="mono">${{ fmt(t.price) }}</span>
            <span class="mono">${{ t.value.toFixed(2) }}</span>
            <span class="mono">{{ portfolio.totalUsd ? ((t.value / portfolio.totalUsd) * 100).toFixed(1) : 0 }}%</span>
            <button class="trade-btn" @click="tradeMint(t.mint)">Trade</button>
          </div>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="section">
        <div class="section-title">Recent Transactions</div>
        <div v-if="loadingTx" class="loading">Loading...</div>
        <div v-else-if="!txHistory.length" class="empty">No transactions found</div>
        <div v-else class="tx-list">
          <div v-for="tx in txHistory" :key="tx.signature" class="tx-row">
            <span class="tx-sig mono">{{ tx.signature?.slice(0,12) }}...</span>
            <span class="tx-time">{{ txAge(tx.blockTime) }}</span>
            <span :class="['tx-status', tx.err ? 'fail' : 'ok']">{{ tx.err ? 'Failed' : 'Success' }}</span>
            <a :href="`https://solscan.io/tx/${tx.signature}`" target="_blank" class="tx-link">View ↗</a>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, watch, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useSolanaWallet } from '../composables/useSolanaWallet';
import { usePortfolio } from '../composables/usePortfolio';
import { useHelius } from '../composables/useHelius';
import WalletConnect from '../components/wallet/WalletConnect.vue';
import TokenLogo from '../components/common/TokenLogo.vue';
import StatCard from '../components/common/StatCard.vue';

export default {
  components: { WalletConnect, TokenLogo, StatCard },
  setup() {
    const store = useStore();
    const router = useRouter();
    const { connected, publicKey, shortKey } = useSolanaWallet();
    const { portfolio, loading, loadPortfolio } = usePortfolio();
    const { getTxHistory } = useHelius();
    const txHistory = ref([]);
    const loadingTx = ref(false);

    async function loadTx() {
      if (!publicKey.value) return;
      loadingTx.value = true;
      txHistory.value = await getTxHistory(publicKey.value, 20);
      loadingTx.value = false;
    }

    watch(connected, async (val) => {
      if (val && publicKey.value) {
        await loadPortfolio(publicKey.value);
        await loadTx();
      }
    });

    onMounted(async () => {
      if (connected.value && publicKey.value) {
        await loadPortfolio(publicKey.value);
        await loadTx();
      }
    });

    function tradeMint(mint) {
      store.commit('trading/SET_INPUT_MINT', mint);
      router.push('/trade');
    }

    const fmt = p => { if (!p) return '0'; if (p < 0.000001) return p.toExponential(2); if (p < 0.01) return p.toFixed(6); return p.toFixed(4); };
    const truncate = (s, n) => s?.length > n ? s.slice(0, n) + '…' : s;
    const txAge = ts => { if (!ts) return ''; const s = Math.floor(Date.now() / 1000 - ts); if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; };

    return { connected, shortKey, portfolio, loading, txHistory, loadingTx, tradeMint, fmt, truncate, txAge };
  },
};
</script>

<style scoped>
.portfolio-page { padding: 24px; background: #0d1117; min-height: calc(100vh - 48px); }
.port-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.port-header h1 { font-size: 1.3rem; color: #e6edf3; margin: 0 0 4px; }
.wallet-addr { font-family: monospace; font-size: 0.8rem; color: #8b949e; }
.connect-prompt { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 24px; color: #8b949e; }
.cp-icon { font-size: 3rem; }
.cp-title { font-size: 1rem; color: #e6edf3; }
.summary-cards { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.section { background: #161b22; border: 1px solid #30363d; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.section-title { padding: 12px 16px; font-weight: 600; font-size: 0.88rem; color: #e6edf3; border-bottom: 1px solid #21262d; }
.loading, .empty { padding: 24px; text-align: center; color: #8b949e; font-size: 0.82rem; }
.ht-header { display: grid; grid-template-columns: 180px 100px 100px 100px 70px 70px; gap: 8px; padding: 8px 16px; font-size: 0.65rem; color: #8b949e; text-transform: uppercase; border-bottom: 1px solid #21262d; }
.ht-row { display: grid; grid-template-columns: 180px 100px 100px 100px 70px 70px; gap: 8px; padding: 9px 16px; border-bottom: 1px solid #21262d; align-items: center; }
.ht-row:hover { background: #21262d; }
.token-cell { display: flex; align-items: center; gap: 8px; }
.sym { font-weight: 600; font-size: 0.85rem; color: #e6edf3; display: block; }
.nm { font-size: 0.7rem; color: #8b949e; }
.mono { font-family: monospace; font-size: 0.8rem; color: #e6edf3; }
.trade-btn { padding: 3px 10px; background: rgba(88,166,255,0.12); border: 1px solid #58a6ff; color: #58a6ff; border-radius: 4px; cursor: pointer; font-size: 0.72rem; }
.tx-list { padding: 4px 0; }
.tx-row { display: flex; align-items: center; gap: 16px; padding: 8px 16px; border-bottom: 1px solid #21262d; font-size: 0.8rem; }
.tx-sig { color: #8b949e; flex: 1; }
.tx-time { color: #8b949e; }
.ok { color: #3fb950; }
.fail { color: #f85149; }
.tx-link { color: #58a6ff; text-decoration: none; }
</style>
