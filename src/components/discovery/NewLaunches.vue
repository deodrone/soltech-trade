<template>
  <div class="new-launches">
    <div class="section-header">
      <span>🚀 New Launches</span>
      <span v-if="newCount > 0" class="live-badge">+{{ newCount }} live</span>
      <div class="tabs">
        <button :class="['tab', { active: tab === 'pump' }]" @click="tab = 'pump'">Pump.fun</button>
        <button :class="['tab', { active: tab === 'raydium' }]" @click="tab = 'raydium'">Raydium</button>
      </div>
      <button class="refresh-btn" @click="load">↻</button>
    </div>
    <div v-if="loading" class="loading">Loading new launches...</div>
    <div v-else class="launches-list">
      <div v-for="t in tokens" :key="t.mint" class="launch-item" @click="$emit('select', t)">
        <token-logo :src="t.image" :symbol="t.symbol" :size="36" />
        <div class="launch-info">
          <div class="launch-top">
            <span class="launch-symbol">{{ t.symbol }}</span>
            <span class="launch-name">{{ truncate(t.name, 18) }}</span>
          </div>
          <div class="launch-meta">
            <span class="age">{{ age(t.createdAt) }}</span>
            <span v-if="t.replies" class="replies">💬 {{ t.replies }}</span>
            <span v-if="t.twitter" class="social">𝕏</span>
            <span v-if="t.telegram" class="social">✈</span>
          </div>
        </div>
        <div class="launch-right">
          <div v-if="t.progress !== undefined" class="bc-progress">
            <div class="bc-label">{{ t.progress.toFixed(0) }}% bonded</div>
            <div class="bc-bar"><div class="bc-fill" :style="{ width: t.progress + '%' }" /></div>
          </div>
          <div class="launch-mcap">MCap: {{ fmtLg(t.usdMarketCap || t.marketCap) }}</div>
          <button class="trade-btn" @click.stop="$emit('trade', t)">Trade</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { usePumpFun } from '../../composables/usePumpFun';
import { useDexScreener } from '../../composables/useDexScreener';
import { useWebSocket } from '../../composables/useWebSocket';
import TokenLogo from '../common/TokenLogo.vue';

export default {
  components: { TokenLogo },
  emits: ['select', 'trade'],
  setup() {
    const { getNewTokens, formatToken, loading: pumpLoading } = usePumpFun();
    const { getNewPairs, loading: dexLoading } = useDexScreener();
    const { connect, on, off } = useWebSocket();
    const tab = ref('pump');
    const tokens = ref([]);
    const loading = ref(false);
    const newCount = ref(0);
    const seen = new Set();

    async function load() {
      loading.value = true;
      try {
        if (tab.value === 'pump') {
          const raw = await getNewTokens({ limit: 40 });
          tokens.value = raw.map(formatToken);
        } else {
          const raw = await getNewPairs();
          tokens.value = raw.slice(0, 40).map(p => ({
            mint: p.baseToken.address,
            symbol: p.baseToken.symbol,
            name: p.baseToken.name,
            image: p.info?.imageUrl,
            createdAt: p.pairCreatedAt,
            usdMarketCap: p.marketCap,
            marketCap: p.marketCap,
          }));
        }
      } finally { loading.value = false; }
    }

    function onNewToken(msg) {
      if (tab.value !== 'pump') return;
      const t = msg.data;
      if (!t?.mint || seen.has(t.mint)) return;
      seen.add(t.mint);
      tokens.value = [t, ...tokens.value].slice(0, 100);
      newCount.value++;
    }

    onMounted(() => { load(); connect(); on('new_token', onNewToken); });
    onBeforeUnmount(() => { off('new_token', onNewToken); });
    watch(tab, load);

    function age(ts) {
      if (!ts) return '';
      const ms = Date.now() - (ts > 1e12 ? ts : ts * 1000);
      const s = Math.floor(ms / 1000);
      if (s < 60) return `${s}s`;
      if (s < 3600) return `${Math.floor(s/60)}m`;
      return `${Math.floor(s/3600)}h`;
    }
    const fmtLg = v => { if (!v) return '—'; if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`; return `$${v.toFixed(0)}`; };
    const truncate = (s, n) => s?.length > n ? s.slice(0, n) + '…' : s;

    return { tab, tokens, loading, newCount, load, age, fmtLg, truncate };
  },
};
</script>

<style scoped>
.new-launches { background: #0d1117; }
.section-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #21262d; font-weight: 600; font-size: 0.85rem; color: #e6edf3; }
.tabs { display: flex; gap: 4px; margin-left: 4px; }
.tab { padding: 3px 10px; background: #21262d; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
.tab.active { border-color: #58a6ff; color: #58a6ff; background: rgba(88,166,255,0.1); }
.live-badge { font-size: 0.65rem; font-weight: 700; padding: 2px 7px; background: rgba(63,185,80,0.15); border: 1px solid #3fb950; color: #3fb950; border-radius: 10px; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
.refresh-btn { margin-left: auto; background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 2px 8px; cursor: pointer; }
.loading { padding: 20px; text-align: center; color: #8b949e; font-size: 0.82rem; }
.launches-list { overflow-y: auto; max-height: 400px; }
.launch-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #161b22; cursor: pointer; }
.launch-item:hover { background: #161b22; }
.launch-info { flex: 1; }
.launch-top { display: flex; align-items: baseline; gap: 6px; }
.launch-symbol { font-weight: 700; font-size: 0.85rem; color: #e6edf3; }
.launch-name { font-size: 0.72rem; color: #8b949e; }
.launch-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; font-size: 0.7rem; color: #8b949e; }
.age { color: #58a6ff; }
.social { font-size: 0.7rem; }
.launch-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.bc-label { font-size: 0.68rem; color: #8b949e; }
.bc-bar { width: 60px; height: 4px; background: #30363d; border-radius: 2px; overflow: hidden; }
.bc-fill { height: 100%; background: linear-gradient(to right, #238636, #58a6ff); border-radius: 2px; }
.launch-mcap { font-size: 0.72rem; color: #8b949e; font-family: monospace; }
.trade-btn { padding: 3px 10px; background: rgba(88,166,255,0.12); border: 1px solid #58a6ff; color: #58a6ff; border-radius: 4px; cursor: pointer; font-size: 0.72rem; }
.trade-btn:hover { background: rgba(88,166,255,0.25); }
</style>
