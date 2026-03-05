<template>
  <div class="token-safety">
    <div class="safety-header">
      <span class="safety-title">Security Analysis</span>
      <button class="refresh-btn" @click="load" :disabled="loading">↻</button>
    </div>

    <div v-if="loading" class="loading">Analyzing...</div>

    <template v-else-if="safety">
      <!-- Risk Score Badge -->
      <div class="risk-badge" :style="{ borderColor: safety.color, background: safety.color + '18' }">
        <div class="risk-score" :style="{ color: safety.color }">{{ safety.riskScore }}</div>
        <div class="risk-label" :style="{ color: safety.color }">{{ safety.label }}</div>
        <div class="risk-bar">
          <div class="risk-fill" :style="{ width: safety.riskScore + '%', background: safety.color }" />
        </div>
      </div>

      <!-- Checks -->
      <div class="checks">
        <div :class="['check-row', safety.mintAuthority ? 'danger' : 'safe']">
          <span class="check-icon">{{ safety.mintAuthority ? '⚠' : '✓' }}</span>
          <span class="check-label">Mint Authority</span>
          <span class="check-value">{{ safety.mintAuthority ? 'Active — can mint more' : 'Revoked' }}</span>
        </div>
        <div :class="['check-row', safety.freezeAuthority ? 'danger' : 'safe']">
          <span class="check-icon">{{ safety.freezeAuthority ? '⚠' : '✓' }}</span>
          <span class="check-label">Freeze Authority</span>
          <span class="check-value">{{ safety.freezeAuthority ? 'Active — can freeze wallets' : 'Revoked' }}</span>
        </div>
        <div class="check-row info">
          <span class="check-icon">ℹ</span>
          <span class="check-label">Top Holder</span>
          <span class="check-value">{{ safety.topHolders?.[0]?.pct || '0' }}% supply</span>
        </div>
        <div class="check-row info">
          <span class="check-icon">ℹ</span>
          <span class="check-label">Top 5 Holders</span>
          <span class="check-value">{{ top5Pct }}% supply</span>
        </div>
      </div>
    </template>

    <div v-if="!loading && !safety" class="empty">Connect to analyze security</div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useTokenSafety } from '../../composables/useTokenSafety';

export default {
  name: 'TokenSafety',
  props: { tokenMint: { type: String, required: true } },
  setup(props) {
    const { analyzeToken } = useTokenSafety();
    const safety  = ref(null);
    const loading = ref(false);

    const top5Pct = computed(() => {
      if (!safety.value?.topHolders) return '0';
      return safety.value.topHolders.slice(0, 5)
        .reduce((s, h) => s + parseFloat(h.pct || 0), 0)
        .toFixed(1);
    });

    async function load() {
      if (!props.tokenMint) return;
      loading.value = true;
      safety.value = await analyzeToken(props.tokenMint);
      loading.value = false;
    }

    onMounted(load);
    watch(() => props.tokenMint, load);

    return { safety, loading, top5Pct, load };
  },
};
</script>

<style scoped>
.token-safety { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; }
.safety-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.safety-title { font-size: 0.8rem; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.04em; }
.refresh-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 2px 7px; cursor: pointer; font-size: 0.75rem; }
.loading, .empty { padding: 12px; text-align: center; color: #8b949e; font-size: 0.8rem; }
.risk-badge { border: 1px solid; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.risk-score { font-size: 1.6rem; font-weight: 900; line-height: 1; }
.risk-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; flex: 1; }
.risk-bar { width: 80px; height: 6px; background: #21262d; border-radius: 3px; overflow: hidden; }
.risk-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
.checks { display: flex; flex-direction: column; gap: 6px; }
.check-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; }
.check-row.safe    { background: rgba(63,185,80,0.08); }
.check-row.danger  { background: rgba(248,81,73,0.08); }
.check-row.info    { background: rgba(88,166,255,0.06); }
.check-icon { font-size: 0.85rem; width: 16px; text-align: center; }
.safe .check-icon  { color: #3fb950; }
.danger .check-icon{ color: #f85149; }
.info .check-icon  { color: #58a6ff; }
.check-label { font-size: 0.78rem; color: #8b949e; flex: 1; }
.check-value { font-size: 0.78rem; font-family: monospace; }
.safe .check-value   { color: #3fb950; }
.danger .check-value { color: #f85149; }
.info .check-value   { color: #58a6ff; }
</style>
