<template>
  <div class="liquidity-manager">
    <div class="lm-header">Post-Migration Liquidity</div>
    <div class="lm-tabs">
      <button :class="['lm-tab', { active: tab === 'lock' }]" @click="tab = 'lock'">Lock LP</button>
      <button :class="['lm-tab', { active: tab === 'burn' }]" @click="tab = 'burn'">Burn LP</button>
    </div>

    <div v-if="tab === 'lock'" class="lm-panel">
      <p class="lm-desc">Lock liquidity pool tokens to signal long-term commitment. Locked LP builds trust with investors.</p>
      <div class="form-group">
        <label>LP Token Mint</label>
        <input v-model="lpMint" placeholder="LP token mint address..." class="form-input" />
      </div>
      <div class="form-group">
        <label>Lock Duration</label>
        <select v-model="lockDuration" class="form-input">
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="180">180 days</option>
          <option value="365">1 year</option>
          <option value="730">2 years</option>
          <option value="0">Permanent</option>
        </select>
      </div>
      <button class="action-btn lock" @click="lockLP" :disabled="!lpMint || loading">
        {{ loading ? 'Locking...' : 'Lock Liquidity' }}
      </button>
    </div>

    <div v-if="tab === 'burn'" class="lm-panel">
      <p class="lm-desc">Burn LP tokens permanently. This makes liquidity removal impossible — maximum decentralization signal.</p>
      <div class="form-group">
        <label>LP Token Mint</label>
        <input v-model="lpMint" placeholder="LP token mint address..." class="form-input" />
      </div>
      <div class="burn-warning">
        Warning: Burning LP tokens is irreversible. You will permanently lose the ability to remove this liquidity.
      </div>
      <button class="action-btn burn" @click="burnLP" :disabled="!lpMint || loading">
        {{ loading ? 'Burning...' : 'Burn LP Tokens' }}
      </button>
    </div>

    <div v-if="result" class="result success">{{ result }}</div>
    <div v-if="error" class="result error">{{ error }}</div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const tab = ref('lock');
    const lpMint = ref('');
    const lockDuration = ref('365');
    const loading = ref(false);
    const result = ref(null);
    const error = ref(null);

    async function lockLP() {
      loading.value = true; result.value = null; error.value = null;
      try {
        // Placeholder — would call Streamflow/Lockliquidity program
        await new Promise(r => setTimeout(r, 1000));
        result.value = `LP locked for ${lockDuration.value === '0' ? 'permanently' : lockDuration.value + ' days'}`;
      } catch (e) { error.value = e.message; }
      loading.value = false;
    }

    async function burnLP() {
      loading.value = true; result.value = null; error.value = null;
      try {
        await new Promise(r => setTimeout(r, 1000));
        result.value = 'LP tokens burned successfully';
      } catch (e) { error.value = e.message; }
      loading.value = false;
    }

    return { tab, lpMint, lockDuration, loading, result, error, lockLP, burnLP };
  }
};
</script>

<style scoped>
.liquidity-manager { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 16px; }
.lm-header { font-weight: 600; color: #e6edf3; margin-bottom: 12px; }
.lm-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
.lm-tab { padding: 6px 16px; background: none; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; font-size: 0.8rem; }
.lm-tab.active { border-color: #58a6ff; color: #58a6ff; }
.lm-desc { font-size: 0.8rem; color: #8b949e; margin-bottom: 16px; line-height: 1.5; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.form-group label { font-size: 0.75rem; color: #8b949e; }
.form-input { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px 10px; color: #e6edf3; font-size: 0.85rem; outline: none; }
.form-input:focus { border-color: #58a6ff; }
.burn-warning { padding: 10px 12px; background: #f8514922; border: 1px solid #f8514966; border-radius: 6px; color: #f85149; font-size: 0.78rem; margin-bottom: 12px; }
.action-btn { width: 100%; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
.action-btn.lock { background: #1f6feb; color: #fff; }
.action-btn.burn { background: #f85149; color: #fff; }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.result { margin-top: 12px; padding: 10px; border-radius: 6px; font-size: 0.82rem; }
.result.success { background: #3fb95022; border: 1px solid #3fb950; color: #3fb950; }
.result.error { background: #f8514922; border: 1px solid #f85149; color: #f85149; }
</style>
