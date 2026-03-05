<template>
  <div class="launchpad-page">
    <div class="lp-header">
      <div>
        <h1>Launchpad</h1>
        <p class="lp-sub">Create and launch your Solana token with a bonding curve on Pump.fun / Raydium LaunchLab</p>
      </div>
      <wallet-connect />
    </div>

    <div class="lp-layout">
      <div class="lp-left">
        <div class="lp-tabs">
          <button :class="['tab', { active: tab === 'create' }]" @click="tab = 'create'">Create Token</button>
          <button :class="['tab', { active: tab === 'manage' }]" @click="tab = 'manage'">Manage Liquidity</button>
        </div>

        <launch-wizard v-if="tab === 'create'" />
        <liquidity-manager v-if="tab === 'manage'" />
      </div>

      <div class="lp-right">
        <bonding-curve
          v-model:curveType="curveType"
          v-model:initialPrice="initialPrice"
          v-model:migrationThreshold="migrationThreshold"
        />

        <div class="lp-recent">
          <div class="lp-recent-header">Recent Launches</div>
          <div v-if="!recentTokens.length" class="lp-recent-empty">Loading...</div>
          <div v-for="t in recentTokens" :key="t.mint" class="lp-recent-row">
            <token-logo :src="t.image_uri" :symbol="t.symbol" :size="24" />
            <div class="lpr-info">
              <span class="lpr-sym">{{ t.symbol }}</span>
              <span class="lpr-name">{{ t.name }}</span>
            </div>
            <span class="lpr-mc">${{ fmtMc(t.usd_market_cap) }}</span>
            <router-link :to="`/token/${t.mint}`" class="view-link">View</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { usePumpFun } from '../composables/usePumpFun';
import LaunchWizard from '../components/launchpad/LaunchWizard.vue';
import BondingCurve from '../components/launchpad/BondingCurve.vue';
import LiquidityManager from '../components/launchpad/LiquidityManager.vue';
import WalletConnect from '../components/wallet/WalletConnect.vue';
import TokenLogo from '../components/common/TokenLogo.vue';

export default {
  components: { LaunchWizard, BondingCurve, LiquidityManager, WalletConnect, TokenLogo },
  setup() {
    const { getNewTokens } = usePumpFun();
    const tab = ref('create');
    const curveType = ref('linear');
    const initialPrice = ref(0.000001);
    const migrationThreshold = ref(85);
    const recentTokens = ref([]);

    function fmtMc(v) {
      if (!v) return '—';
      if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`;
      if (v >= 1e3) return `${(v/1e3).toFixed(0)}K`;
      return v.toFixed(0);
    }

    onMounted(async () => {
      recentTokens.value = (await getNewTokens({ limit: 10 })).slice(0, 10);
    });

    return { tab, curveType, initialPrice, migrationThreshold, recentTokens, fmtMc };
  }
};
</script>

<style scoped>
.launchpad-page { padding: 24px; background: #0d1117; min-height: calc(100vh - 48px); }
.lp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.lp-header h1 { color: #e6edf3; margin: 0 0 4px; }
.lp-sub { color: #8b949e; font-size: 0.85rem; margin: 0; }
.lp-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
.lp-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
.tab { padding: 7px 18px; background: none; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; font-size: 0.82rem; }
.tab.active { border-color: #58a6ff; color: #58a6ff; background: #1f6feb22; }
.lp-right { display: flex; flex-direction: column; gap: 16px; }
.lp-recent { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 12px; }
.lp-recent-header { font-size: 0.82rem; font-weight: 600; color: #e6edf3; margin-bottom: 10px; }
.lp-recent-empty { color: #8b949e; font-size: 0.8rem; padding: 8px 0; }
.lp-recent-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #21262d; }
.lpr-info { flex: 1; display: flex; flex-direction: column; }
.lpr-sym { font-size: 0.8rem; font-weight: 600; color: #e6edf3; }
.lpr-name { font-size: 0.65rem; color: #8b949e; }
.lpr-mc { font-size: 0.75rem; color: #3fb950; font-family: monospace; }
.view-link { font-size: 0.72rem; color: #58a6ff; text-decoration: none; }
@media (max-width: 900px) { .lp-layout { grid-template-columns: 1fr; } }
</style>
