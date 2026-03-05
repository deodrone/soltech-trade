<template>
  <div class="sniper-feed">
    <div class="sniper-header">
      <span class="sniper-title">🎯 Sniper Feed</span>
      <div class="sniper-controls">
        <label class="auto-toggle">
          <input type="checkbox" v-model="autoBuyEnabled" />
          <span>Auto-Buy</span>
        </label>
        <div v-if="autoBuyEnabled" class="auto-amount-wrap">
          <input v-model.number="autoBuyAmount" type="number" min="0.001" step="0.01" placeholder="SOL" class="auto-amount-input" />
          <span class="auto-sol">SOL</span>
        </div>
        <button class="live-btn" :class="{ active: live }" @click="toggleLive">
          {{ live ? (wsActive ? '⚡ LIVE' : '● LIVE') : '○ PAUSED' }}
        </button>
      </div>
    </div>

    <!-- Sniper Filters -->
    <div class="sniper-filters">
      <div class="sf-group">
        <span class="sf-label">Min MCap</span>
        <input v-model.number="filters.minMcap" type="number" placeholder="0" class="sf-input" />
      </div>
      <div class="sf-group">
        <span class="sf-label">Max MCap</span>
        <input v-model.number="filters.maxMcap" type="number" placeholder="∞" class="sf-input" />
      </div>
      <div class="sf-group">
        <span class="sf-label">Source</span>
        <select v-model="filters.source" class="sf-select">
          <option value="all">All</option>
          <option value="pump">Pump.fun</option>
          <option value="raydium">Raydium</option>
        </select>
      </div>
      <label class="sf-check">
        <input type="checkbox" v-model="filters.noMintAuth" />
        <span>No Mint Auth</span>
      </label>
    </div>

    <div v-if="!filteredTokens.length" class="sniper-empty">
      <span v-if="live">Watching for new launches...</span>
      <span v-else>Start live mode to watch for launches</span>
    </div>

    <div class="sniper-list">
      <transition-group name="sniper-item">
        <div v-for="t in filteredTokens" :key="t.mint" class="sniper-row">
          <div class="sniper-age">{{ age(t.createdAt) }}</div>
          <token-logo :src="t.image" :symbol="t.symbol" :size="32" />
          <div class="sniper-info">
            <div class="sniper-top">
              <span class="sniper-sym">{{ t.symbol }}</span>
              <span class="sniper-name">{{ t.name }}</span>
              <span class="sniper-source">{{ t.source }}</span>
            </div>
            <div class="sniper-meta">
              <span class="meta-item">MCap: {{ fmtLg(t.marketCap) }}</span>
              <span v-if="t.progress !== undefined" class="meta-item">{{ t.progress?.toFixed(0) }}% bonded</span>
              <span v-if="t.twitter" class="social">𝕏</span>
              <span v-if="t.telegram" class="social">✈</span>
            </div>
          </div>
          <div class="sniper-actions">
            <button class="view-btn" @click="$emit('select', t)">View</button>
            <button
              class="snipe-btn"
              :class="{ sniped: t.sniped }"
              :disabled="!connected || t.sniped || sniping === t.mint"
              @click="snipe(t)"
            >
              <span v-if="sniping === t.mint">...</span>
              <span v-else-if="t.sniped">✓</span>
              <span v-else>Snipe</span>
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { usePumpFun } from '../../composables/usePumpFun';
import { useJupiter } from '../../composables/useJupiter';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import { useToast } from '../../composables/useToast';
import { useWebSocket } from '../../composables/useWebSocket';
import TokenLogo from '../common/TokenLogo.vue';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default {
  name: 'SniperFeed',
  components: { TokenLogo },
  emits: ['select', 'trade'],
  setup(_, { emit }) {
    const { getNewTokens, formatToken } = usePumpFun();
    const { getQuote, getSwapTransaction, uiToLamports } = useJupiter();
    const { connected, publicKey, signAndSendTransaction } = useSolanaWallet();
    const { show } = useToast();
    const { connect, on, off } = useWebSocket();

    const tokens = ref([]);
    const live = ref(false);
    const autoBuyEnabled = ref(false);
    const autoBuyAmount = ref(0.1);
    const sniping = ref(null);
    const wsActive = ref(false);
    const filters = ref({ minMcap: null, maxMcap: null, source: 'all', noMintAuth: false });

    let pollTimer = null;
    let lastSeen = new Set();

    const filteredTokens = computed(() => {
      return tokens.value.filter(t => {
        const mc = t.marketCap || t.usdMarketCap || 0;
        if (filters.value.minMcap && mc < filters.value.minMcap) return false;
        if (filters.value.maxMcap && mc > filters.value.maxMcap) return false;
        if (filters.value.source !== 'all' && t.source !== filters.value.source) return false;
        return true;
      });
    });

    // Real-time WebSocket handler for new tokens from backend relay
    function onNewToken(msg) {
      if (!live.value) return;
      const t = msg.data;
      if (!t?.mint || lastSeen.has(t.mint)) return;
      lastSeen.add(t.mint);
      tokens.value = [t, ...tokens.value].slice(0, 200);
      if (autoBuyEnabled.value && autoBuyAmount.value > 0 && connected.value) {
        snipe(t, true);
      }
    }

    // Fallback HTTP poll (catches anything WS misses)
    async function fetchNew() {
      const raw = await getNewTokens({ limit: 20 });
      const formatted = raw.map(t => ({ ...formatToken(t), source: 'pump' }));
      const newTokens = formatted.filter(t => !lastSeen.has(t.mint));
      newTokens.forEach(t => lastSeen.add(t.mint));
      if (newTokens.length) {
        tokens.value = [...newTokens, ...tokens.value].slice(0, 200);
        if (autoBuyEnabled.value && autoBuyAmount.value > 0 && connected.value) {
          snipe(newTokens[0], true);
        }
      }
    }

    function toggleLive() {
      live.value = !live.value;
      if (live.value) {
        // Try WebSocket first (real-time, sub-second)
        connect();
        on('new_token', onNewToken);
        wsActive.value = true;
        // Also seed with latest from API
        fetchNew();
        // Fallback poll every 30s (catches edge cases)
        pollTimer = setInterval(fetchNew, 30000);
      } else {
        off('new_token', onNewToken);
        wsActive.value = false;
        clearInterval(pollTimer);
      }
    }

    async function snipe(token, silent = false) {
      if (!connected.value) { show({ message: 'Connect wallet first', type: 'warning' }); return; }
      sniping.value = token.mint;
      try {
        const amount = uiToLamports(autoBuyAmount.value || 0.1, 9);
        const quote = await getQuote({ inputMint: SOL_MINT, outputMint: token.mint, amount, slippageBps: 500 });
        if (!quote) throw new Error('No quote available');
        const tx = await getSwapTransaction({ quoteResponse: quote, userPublicKey: publicKey.value, useJito: true });
        await signAndSendTransaction(tx);
        token.sniped = true;
        if (!silent) show({ message: `Sniped ${token.symbol}!`, type: 'success' });
        emit('trade', token);
      } catch (e) {
        if (!silent) show({ message: `Snipe failed: ${e.message}`, type: 'error' });
      } finally { sniping.value = null; }
    }

    onMounted(() => {
      fetchNew();
      // Pre-connect WebSocket so it's ready when user hits Live
      connect();
    });
    onBeforeUnmount(() => {
      clearInterval(pollTimer);
      off('new_token', onNewToken);
    });

    function age(ts) {
      if (!ts) return '';
      const s = Math.floor((Date.now() - (ts > 1e12 ? ts : ts * 1000)) / 1000);
      if (s < 60) return `${s}s`;
      if (s < 3600) return `${Math.floor(s / 60)}m`;
      return `${Math.floor(s / 3600)}h`;
    }
    const fmtLg = v => { if (!v) return '—'; if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`; if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`; return `$${v.toFixed(0)}`; };

    return { tokens, filteredTokens, live, wsActive, autoBuyEnabled, autoBuyAmount, sniping, filters, connected, toggleLive, snipe, age, fmtLg };
  },
};
</script>

<style scoped>
.sniper-feed { background: #0d1117; }
.sniper-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #21262d; }
.sniper-title { font-weight: 700; font-size: 0.88rem; color: #e6edf3; }
.sniper-controls { display: flex; align-items: center; gap: 10px; }
.auto-toggle { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.78rem; color: #8b949e; }
.auto-toggle input[type=checkbox] { accent-color: #3fb950; }
.auto-amount-wrap { display: flex; align-items: center; background: #21262d; border: 1px solid #30363d; border-radius: 5px; padding: 0 7px; }
.auto-amount-input { background: none; border: none; outline: none; color: #e6edf3; font-size: 0.8rem; width: 50px; padding: 4px 0; }
.auto-sol { font-size: 0.72rem; color: #8b949e; }
.live-btn { padding: 4px 10px; border-radius: 5px; cursor: pointer; font-size: 0.75rem; font-weight: 700; border: 1px solid #30363d; background: #21262d; color: #8b949e; }
.live-btn.active { border-color: #3fb950; color: #3fb950; background: rgba(63,185,80,0.1); animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.sniper-filters { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-bottom: 1px solid #21262d; flex-wrap: wrap; }
.sf-group { display: flex; align-items: center; gap: 5px; }
.sf-label { font-size: 0.7rem; color: #8b949e; white-space: nowrap; }
.sf-input { background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 4px 7px; color: #e6edf3; font-size: 0.75rem; outline: none; width: 80px; }
.sf-select { background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 4px 7px; color: #e6edf3; font-size: 0.75rem; outline: none; }
.sf-check { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #8b949e; cursor: pointer; }
.sf-check input[type=checkbox] { accent-color: #58a6ff; }
.sniper-empty { padding: 24px; text-align: center; color: #8b949e; font-size: 0.82rem; }
.sniper-list { overflow-y: auto; max-height: 450px; }
.sniper-row { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-bottom: 1px solid #161b22; }
.sniper-row:hover { background: #161b22; }
.sniper-age { font-size: 0.7rem; color: #58a6ff; font-family: monospace; min-width: 28px; }
.sniper-info { flex: 1; }
.sniper-top { display: flex; align-items: baseline; gap: 6px; }
.sniper-sym { font-weight: 700; font-size: 0.85rem; color: #e6edf3; }
.sniper-name { font-size: 0.72rem; color: #8b949e; flex: 1; }
.sniper-source { font-size: 0.65rem; background: rgba(88,166,255,0.12); color: #58a6ff; padding: 1px 5px; border-radius: 3px; }
.sniper-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; font-size: 0.7rem; color: #8b949e; }
.meta-item { }
.social { font-size: 0.7rem; }
.sniper-actions { display: flex; gap: 5px; }
.view-btn { padding: 4px 10px; background: rgba(88,166,255,0.1); border: 1px solid #58a6ff; color: #58a6ff; border-radius: 4px; cursor: pointer; font-size: 0.72rem; }
.snipe-btn { padding: 4px 12px; background: #3fb950; border: none; border-radius: 4px; color: #fff; font-size: 0.72rem; font-weight: 700; cursor: pointer; min-width: 50px; }
.snipe-btn:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
.snipe-btn.sniped { background: rgba(63,185,80,0.2); color: #3fb950; }
.sniper-item-enter-active { animation: slideIn 0.3s ease; }
@keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
</style>
