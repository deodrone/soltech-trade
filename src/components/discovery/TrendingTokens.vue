<template>
  <div class="trending">
    <div class="section-header">
      <span>🔥 Trending on Solana</span>
      <button class="refresh-btn" @click="load" :disabled="loading">↻</button>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="token-table">
      <div class="table-header">
        <span>#</span><span>Token</span><span>Price</span><span>5m</span><span>1h</span><span>24h</span><span>Vol 24h</span><span>Liq</span><span>MCap</span><span></span>
      </div>
      <div v-for="(t, i) in tokens" :key="t.address || i" class="table-row" @click="$emit('select', t)">
        <span class="rank">{{ i + 1 }}</span>
        <div class="token-cell">
          <token-logo :src="t.logo" :symbol="t.symbol" :size="24" />
          <div>
            <span class="sym">{{ t.symbol }}</span>
            <span class="nm">{{ truncate(t.name, 12) }}</span>
          </div>
        </div>
        <span class="mono">${{ fmt(t.price) }}</span>
        <price-change :value="t.change5m || 0" />
        <price-change :value="t.change1h || 0" />
        <price-change :value="t.change24h || 0" />
        <span class="mono">{{ fmtLg(t.volume24h) }}</span>
        <span class="mono">{{ fmtLg(t.liquidity) }}</span>
        <span class="mono">{{ fmtLg(t.marketCap) }}</span>
        <button class="trade-btn" @click.stop="$emit('trade', t)">Trade</button>
      </div>
    </div>
    <div v-if="!loading && !tokens.length" class="empty">No data available</div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useDexScreener } from '../../composables/useDexScreener';
import TokenLogo from '../common/TokenLogo.vue';
import PriceChange from '../common/PriceChange.vue';

export default {
  components: { TokenLogo, PriceChange },
  emits: ['select', 'trade'],
  setup() {
    const { getTrending, formatPair, loading } = useDexScreener();
    const tokens = ref([]);

    async function load() {
      const raw = await getTrending();
      tokens.value = raw.slice(0, 30).map(t => ({
        symbol: t.tokenAddress?.slice(0, 6) || '?',
        name: t.description || t.tokenAddress,
        logo: t.icon,
        address: t.tokenAddress,
        price: 0,
        change24h: 0,
        change1h: 0,
        change5m: 0,
        volume24h: 0,
        liquidity: 0,
        marketCap: 0,
      }));
      // Enrich with pair data via DexScreener search
      // For each token fetch pair
      await Promise.allSettled(tokens.value.slice(0, 20).map(async (t, i) => {
        try {
          const { getTokenPairs } = useDexScreener();
          const pairs = await getTokenPairs(t.address);
          if (pairs.length) {
            const p = pairs[0];
            tokens.value[i] = { ...tokens.value[i], ...formatPair(p), symbol: p.baseToken.symbol, name: p.baseToken.name, logo: p.info?.imageUrl || t.logo };
          }
        } catch { /* skip */ }
      }));
    }

    onMounted(load);
    const fmt = p => { if (!p) return '—'; if (p < 0.000001) return p.toExponential(2); if (p < 0.01) return p.toFixed(8); return p.toFixed(4); };
    const fmtLg = v => { if (!v) return '—'; if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`; if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`; return `$${v.toFixed(0)}`; };
    const truncate = (s, n) => s?.length > n ? s.slice(0, n) + '…' : s;

    return { tokens, loading, load, fmt, fmtLg, truncate };
  },
};
</script>

<style scoped>
.trending { background: #0d1117; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #21262d; font-weight: 600; font-size: 0.85rem; color: #e6edf3; }
.refresh-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 2px 8px; cursor: pointer; }
.refresh-btn:hover { border-color: #58a6ff; color: #58a6ff; }
.loading, .empty { padding: 20px; text-align: center; color: #8b949e; font-size: 0.82rem; }
.table-header { display: grid; grid-template-columns: 28px 160px 90px 65px 65px 65px 90px 80px 80px 60px; gap: 4px; padding: 6px 12px; font-size: 0.65rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #21262d; }
.table-row { display: grid; grid-template-columns: 28px 160px 90px 65px 65px 65px 90px 80px 80px 60px; gap: 4px; padding: 7px 12px; border-bottom: 1px solid #161b22; align-items: center; cursor: pointer; }
.table-row:hover { background: #161b22; }
.rank { font-size: 0.75rem; color: #8b949e; }
.token-cell { display: flex; align-items: center; gap: 6px; }
.sym { font-weight: 600; font-size: 0.82rem; color: #e6edf3; display: block; }
.nm { font-size: 0.68rem; color: #8b949e; }
.mono { font-family: monospace; font-size: 0.8rem; color: #e6edf3; }
.trade-btn { padding: 3px 8px; background: rgba(88,166,255,0.12); border: 1px solid #58a6ff; color: #58a6ff; border-radius: 4px; cursor: pointer; font-size: 0.72rem; }
.trade-btn:hover { background: rgba(88,166,255,0.25); }
</style>
