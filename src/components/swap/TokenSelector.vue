<template>
  <teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <span>Select Token</span>
          <button @click="$emit('close')">✕</button>
        </div>
        <input ref="searchInput" v-model="query" placeholder="Search name, symbol, or mint..." class="search-input" autofocus />
        <div class="token-list">
          <div v-if="loading" class="loading">Searching...</div>
          <div v-else-if="!results.length" class="empty">No tokens found</div>
          <div
            v-for="t in results"
            :key="t.address"
            class="token-row"
            @click="select(t)"
          >
            <token-logo :src="t.logoURI" :symbol="t.symbol" :size="32" />
            <div class="token-info">
              <span class="symbol">{{ t.symbol }}</span>
              <span class="name">{{ t.name }}</span>
            </div>
            <div v-if="t.price" class="token-price">${{ formatPrice(t.price) }}</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useJupiter } from '../../composables/useJupiter';
import TokenLogo from '../common/TokenLogo.vue';

const POPULAR = [
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
  { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether USD', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png' },
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I' },
  { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat', logoURI: 'https://bafkreibk3covs5ltyqxa272uodhculbyfbbkznam24ynp7yy3boam7vbzu.ipfs.nftstorage.link' },
];

export default {
  components: { TokenLogo },
  emits: ['select', 'close'],
  setup(_, { emit }) {
    const store = useStore();
    const { getTokenList } = useJupiter();
    const query = ref('');
    const results = ref(POPULAR);
    const loading = ref(false);
    const allTokens = ref([]);
    const searchInput = ref(null);

    onMounted(async () => {
      searchInput.value?.focus();
      allTokens.value = await getTokenList();
    });

    watch(query, (q) => {
      if (!q.trim()) { results.value = POPULAR; return; }
      const lower = q.toLowerCase().trim();
      results.value = allTokens.value.filter(t =>
        t.symbol?.toLowerCase().includes(lower) ||
        t.name?.toLowerCase().includes(lower) ||
        t.address?.toLowerCase() === lower
      ).slice(0, 50);
    });

    function select(token) { emit('select', token); emit('close'); }
    function formatPrice(p) {
      if (p < 0.0001) return p.toExponential(2);
      if (p < 1) return p.toFixed(6);
      return p.toFixed(2);
    }

    return { query, results, loading, select, formatPrice, searchInput };
  },
};
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 500; display: flex; align-items: center; justify-content: center; }
.modal { background: #161b22; border: 1px solid #30363d; border-radius: 12px; width: 420px; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #21262d; font-weight: 600; color: #e6edf3; }
.modal-header button { background: none; border: none; color: #8b949e; font-size: 1rem; cursor: pointer; }
.search-input { margin: 12px; padding: 10px 14px; background: #21262d; border: 1px solid #30363d; border-radius: 8px; color: #e6edf3; font-size: 0.9rem; outline: none; }
.search-input:focus { border-color: #58a6ff; }
.token-list { overflow-y: auto; flex: 1; padding: 0 8px 12px; }
.loading, .empty { text-align: center; color: #8b949e; padding: 24px; font-size: 0.85rem; }
.token-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; cursor: pointer; }
.token-row:hover { background: #21262d; }
.token-info { flex: 1; }
.symbol { font-weight: 600; font-size: 0.9rem; color: #e6edf3; display: block; }
.name { font-size: 0.75rem; color: #8b949e; }
.token-price { font-size: 0.82rem; color: #8b949e; font-family: monospace; }
</style>
