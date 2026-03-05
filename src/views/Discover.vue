<template>
  <div class="discover-page">
    <div class="discover-header">
      <h1>Discover</h1>
      <input v-model="searchQuery" placeholder="🔍 Search tokens, pairs, wallets..." class="search-bar" @input="onSearch" />
      <button class="filter-toggle" :class="{ active: showFilters }" @click="showFilters = !showFilters">
        ⚙ Filters <span v-if="filterCount > 0" class="filter-badge">{{ filterCount }}</span>
      </button>
    </div>

    <!-- Advanced Filters Panel -->
    <token-filters v-if="showFilters" @update="onFiltersUpdate" class="filters-panel" />

    <div class="discover-tabs">
      <button :class="['tab', { active: tab === 'trending' }]" @click="tab = 'trending'">🔥 Trending</button>
      <button :class="['tab', { active: tab === 'new' }]" @click="tab = 'new'">🚀 New Launches</button>
      <button :class="['tab', { active: tab === 'sniper' }]" @click="tab = 'sniper'">🎯 Sniper</button>
      <button :class="['tab', { active: tab === 'gainers' }]" @click="tab = 'gainers'">📈 Gainers</button>
      <button :class="['tab', { active: tab === 'search' }]" @click="tab = 'search'" v-if="searchQuery">🔍 Results</button>
    </div>

    <div class="discover-content">
      <trending-tokens v-if="tab === 'trending'" @trade="onTrade" @select="onSelect" :filters="activeFilters" />
      <new-launches v-if="tab === 'new'" @trade="onTrade" @select="onSelect" />
      <sniper-feed v-if="tab === 'sniper'" @trade="onTrade" @select="onSelect" />
      <div v-if="tab === 'gainers'" class="gainers">
        <div v-if="loadingGainers" class="loading">Loading...</div>
        <token-card v-for="t in gainers" :key="t.address" :token="t" @trade="onTrade" @click="onSelect" />
      </div>
      <div v-if="tab === 'search'" class="search-results">
        <div v-if="searching" class="loading">Searching...</div>
        <div v-else-if="!searchResults.length" class="empty">No results for "{{ searchQuery }}"</div>
        <token-card v-for="t in searchResults" :key="t.address" :token="t" @trade="onTrade" @click="onSelect" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDexScreener } from '../composables/useDexScreener';
import TrendingTokens from '../components/discovery/TrendingTokens.vue';
import NewLaunches from '../components/discovery/NewLaunches.vue';
import SniperFeed from '../components/discovery/SniperFeed.vue';
import TokenFilters from '../components/discovery/TokenFilters.vue';
import TokenCard from '../components/discovery/TokenCard.vue';

export default {
  components: { TrendingTokens, NewLaunches, SniperFeed, TokenFilters, TokenCard },
  setup() {
    const router = useRouter();
    const store = useStore();
    const { searchTokens, getTokenPairs, formatPair, loading: dexLoading } = useDexScreener();
    const tab = ref('trending');
    const searchQuery = ref('');
    const searchResults = ref([]);
    const searching = ref(false);
    const gainers = ref([]);
    const loadingGainers = ref(false);
    const showFilters = ref(false);
    const activeFilters = ref({});
    const filterCount = ref(0);

    // Top Solana gainers by 24h change via DexScreener boosted/trending
    async function loadGainers() {
      loadingGainers.value = true;
      try {
        const raw = await searchTokens('SOL');
        gainers.value = raw
          .filter(p => p.priceChange?.h24 > 0)
          .sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0))
          .slice(0, 30)
          .map(p => ({
            address: p.baseToken?.address,
            symbol: p.baseToken?.symbol,
            name: p.baseToken?.name,
            logo: p.info?.imageUrl,
            ...formatPair(p),
          }));
      } catch { gainers.value = []; }
      finally { loadingGainers.value = false; }
    }

    watch(tab, (val) => { if (val === 'gainers' && !gainers.value.length) loadGainers(); });

    function onFiltersUpdate(f) {
      activeFilters.value = f;
      filterCount.value = Object.values(f).filter(v => v !== null && v !== false && v !== '').length;
    }

    let searchTimer = null;
    function onSearch() {
      if (!searchQuery.value.trim()) return;
      tab.value = 'search';
      clearTimeout(searchTimer);
      searchTimer = setTimeout(doSearch, 400);
    }

    async function doSearch() {
      searching.value = true;
      try {
        const raw = await searchTokens(searchQuery.value);
        searchResults.value = raw.slice(0, 30).map(p => ({
          address: p.baseToken.address,
          symbol: p.baseToken.symbol,
          name: p.baseToken.name,
          logo: p.info?.imageUrl,
          ...formatPair(p),
        }));
      } finally { searching.value = false; }
    }

    function onTrade(token) {
      const mint = token.mint || token.address;
      store.commit('trading/SET_INPUT_MINT', mint);
      router.push('/trade');
    }

    function onSelect(token) {
      router.push(`/token/${token.mint || token.address}`);
    }

    return { tab, searchQuery, searchResults, searching, gainers, loadingGainers, showFilters, activeFilters, filterCount, onSearch, onTrade, onSelect, onFiltersUpdate };
  },
};
</script>

<style scoped>
.discover-page { padding: 20px 24px; background: #0d1117; min-height: calc(100vh - 48px); }
.discover-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.discover-header h1 { font-size: 1.3rem; color: #e6edf3; font-weight: 700; margin: 0; }
.search-bar { flex: 1; max-width: 480px; padding: 9px 14px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; color: #e6edf3; font-size: 0.88rem; outline: none; }
.search-bar:focus { border-color: #58a6ff; }
.filter-toggle { padding: 8px 14px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; color: #8b949e; cursor: pointer; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; }
.filter-toggle:hover, .filter-toggle.active { border-color: #58a6ff; color: #58a6ff; background: rgba(88,166,255,0.06); }
.filter-badge { background: #1f6feb; color: #fff; border-radius: 10px; padding: 1px 6px; font-size: 0.7rem; }
.filters-panel { margin-bottom: 16px; }
.discover-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #21262d; }
.tab { padding: 8px 16px; background: none; border: none; border-bottom: 2px solid transparent; color: #8b949e; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; margin-bottom: -1px; }
.tab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
.tab:hover:not(.active) { color: #e6edf3; }
.loading, .empty { padding: 40px; text-align: center; color: #8b949e; }
.discover-content { background: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
</style>
