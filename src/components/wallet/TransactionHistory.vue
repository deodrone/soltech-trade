<template>
  <div class="tx-history">
    <div class="txh-header">
      <span>Transaction History</span>
      <button class="refresh-btn" @click="load" :disabled="loading">↻</button>
    </div>

    <div v-if="loading" class="loading">Loading transactions...</div>
    <div v-else-if="!connected" class="empty">Connect wallet to view transactions</div>
    <div v-else-if="!txs.length" class="empty">No recent transactions</div>

    <div v-else class="tx-list">
      <div v-for="tx in txs" :key="tx.signature" class="tx-row">
        <div class="tx-icon" :class="tx.type">
          {{ tx.type === 'swap' ? '⇄' : tx.type === 'receive' ? '↓' : '↑' }}
        </div>
        <div class="tx-info">
          <span class="tx-desc">{{ tx.description || tx.type }}</span>
          <span class="tx-time">{{ timeAgo(tx.timestamp) }}</span>
        </div>
        <div class="tx-amount" :class="tx.type === 'receive' ? 'positive' : ''">
          {{ tx.type === 'receive' ? '+' : '' }}{{ tx.amount }}
        </div>
        <a :href="`https://solscan.io/tx/${tx.signature}`" target="_blank" class="tx-link" title="View on Solscan">↗</a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHelius } from '../../composables/useHelius';

export default {
  setup() {
    const store = useStore();
    const { getTxHistory } = useHelius();
    const txs = ref([]);
    const loading = ref(false);
    const connected = computed(() => store.state.wallet.connected);
    const publicKey = computed(() => store.state.wallet.publicKey);

    async function load() {
      if (!publicKey.value) return;
      loading.value = true;
      try {
        const raw = await getTxHistory(publicKey.value, { limit: 50 });
        txs.value = (raw || []).map(tx => ({
          signature: tx.signature,
          type: inferType(tx),
          description: tx.description,
          amount: fmtAmount(tx),
          timestamp: tx.timestamp * 1000,
        }));
      } catch (e) { console.error(e); }
      loading.value = false;
    }

    function inferType(tx) {
      if (tx.type === 'SWAP') return 'swap';
      if (tx.type === 'TRANSFER') return tx.tokenTransfers?.[0]?.fromUserAccount === publicKey.value ? 'send' : 'receive';
      return tx.type?.toLowerCase() || 'unknown';
    }

    function fmtAmount(tx) {
      if (tx.nativeTransfers?.length) {
        const amt = tx.nativeTransfers[0].amount / 1e9;
        return `${amt.toFixed(4)} SOL`;
      }
      if (tx.tokenTransfers?.length) {
        const t = tx.tokenTransfers[0];
        return `${(t.tokenAmount || 0).toFixed(4)} tokens`;
      }
      return '';
    }

    function timeAgo(ts) {
      const diff = Date.now() - ts;
      const m = Math.floor(diff / 60000);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      if (d > 0) return `${d}d ago`;
      if (h > 0) return `${h}h ago`;
      if (m > 0) return `${m}m ago`;
      return 'just now';
    }

    onMounted(() => { if (connected.value) load(); });

    return { txs, loading, connected, load, timeAgo };
  }
};
</script>

<style scoped>
.tx-history { background: #0d1117; }
.txh-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #21262d; font-weight: 600; color: #e6edf3; }
.refresh-btn { padding: 4px 10px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #8b949e; cursor: pointer; }
.loading, .empty { padding: 40px; text-align: center; color: #8b949e; }
.tx-list { max-height: 400px; overflow-y: auto; }
.tx-row { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #161b22; }
.tx-row:hover { background: #161b22; }
.tx-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
.tx-icon.swap { background: #1f6feb33; color: #58a6ff; }
.tx-icon.receive { background: #3fb95033; color: #3fb950; }
.tx-icon.send { background: #f8514933; color: #f85149; }
.tx-info { flex: 1; display: flex; flex-direction: column; }
.tx-desc { font-size: 0.82rem; color: #e6edf3; text-transform: capitalize; }
.tx-time { font-size: 0.68rem; color: #8b949e; }
.tx-amount { font-family: monospace; font-size: 0.8rem; color: #e6edf3; }
.tx-amount.positive { color: #3fb950; }
.tx-link { color: #8b949e; text-decoration: none; font-size: 0.8rem; }
.tx-link:hover { color: #58a6ff; }
</style>
