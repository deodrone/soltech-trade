<template>
  <div class="launch-wizard">
    <div class="wizard-steps">
      <div v-for="(s, i) in steps" :key="i" :class="['step', { active: currentStep === i, done: currentStep > i }]">
        <div class="step-num">{{ currentStep > i ? '✓' : i + 1 }}</div>
        <span class="step-label">{{ s }}</span>
      </div>
    </div>

    <!-- Step 0: Token Info -->
    <div v-if="currentStep === 0" class="wizard-panel">
      <h3>Token Information</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Token Name *</label>
          <input v-model="form.name" placeholder="e.g. My Token" class="form-input" />
        </div>
        <div class="form-group">
          <label>Symbol *</label>
          <input v-model="form.symbol" placeholder="e.g. MTK" class="form-input" maxlength="10" />
        </div>
        <div class="form-group full">
          <label>Description</label>
          <textarea v-model="form.description" placeholder="Describe your token..." class="form-input" rows="3" />
        </div>
        <div class="form-group">
          <label>Total Supply *</label>
          <input v-model.number="form.supply" type="number" min="1" class="form-input" />
        </div>
        <div class="form-group">
          <label>Decimals</label>
          <input v-model.number="form.decimals" type="number" min="0" max="9" class="form-input" />
        </div>
        <div class="form-group full">
          <label>Logo URL (optional)</label>
          <input v-model="form.logoUrl" placeholder="https://..." class="form-input" />
        </div>
        <div class="form-group">
          <label>Twitter / 𝕏 (optional)</label>
          <input v-model="form.twitter" placeholder="@handle" class="form-input" />
        </div>
        <div class="form-group">
          <label>Telegram (optional)</label>
          <input v-model="form.telegram" placeholder="t.me/group" class="form-input" />
        </div>
        <div class="form-group full">
          <label>Website (optional)</label>
          <input v-model="form.website" placeholder="https://mytoken.io" class="form-input" />
        </div>
      </div>
    </div>

    <!-- Step 1: Bonding Curve -->
    <div v-if="currentStep === 1" class="wizard-panel">
      <h3>Bonding Curve</h3>
      <div class="curve-options">
        <div v-for="curve in curves" :key="curve.type" :class="['curve-option', { active: form.curveType === curve.type }]" @click="form.curveType = curve.type">
          <span class="curve-icon">{{ curve.icon }}</span>
          <span class="curve-name">{{ curve.name }}</span>
          <span class="curve-desc">{{ curve.desc }}</span>
        </div>
      </div>
      <div class="form-group">
        <label>Initial Price (SOL)</label>
        <input v-model.number="form.initialPrice" type="number" min="0.000001" step="0.001" class="form-input" />
      </div>
      <div class="form-group">
        <label>Migration Threshold (SOL)</label>
        <input v-model.number="form.migrationThreshold" type="number" min="1" class="form-input" />
      </div>
      <div class="form-group">
        <label>Quote Token</label>
        <div class="quote-options">
          <button v-for="q in ['SOL','USDC']" :key="q" :class="['quote-btn', { active: form.quoteToken === q }]" @click="form.quoteToken = q">{{ q }}</button>
        </div>
      </div>
    </div>

    <!-- Step 2: Tokenomics -->
    <div v-if="currentStep === 2" class="wizard-panel">
      <h3>Tokenomics & Fees</h3>

      <div class="form-group">
        <label>Creator Fee (%)</label>
        <div class="fee-options">
          <button v-for="f in [0, 0.5, 1, 2, 5]" :key="f" :class="['fee-btn', { active: form.creatorFeePct === f }]" @click="form.creatorFeePct = f">
            {{ f === 0 ? 'None' : f + '%' }}
          </button>
        </div>
        <p class="form-hint">Collected from each swap on your token's pool</p>
      </div>

      <div class="form-group">
        <label>Creator Initial Buy ({{ form.quoteToken }})</label>
        <input v-model.number="form.creatorInitialBuy" type="number" min="0" step="0.01" placeholder="0 = don't buy" class="form-input" />
        <p class="form-hint">Optionally buy tokens at launch to show conviction</p>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="form.vestingEnabled" />
          <span>Enable Vesting for Creator Allocation</span>
        </label>
      </div>

      <div v-if="form.vestingEnabled" class="vesting-grid">
        <div class="form-group">
          <label>Cliff Period (days)</label>
          <input v-model.number="form.vestingCliffDays" type="number" min="0" class="form-input" />
        </div>
        <div class="form-group">
          <label>Vesting Duration (days)</label>
          <input v-model.number="form.vestingPeriodDays" type="number" min="1" class="form-input" />
        </div>
      </div>
    </div>

    <!-- Step 3: Review & Launch -->
    <div v-if="currentStep === 3" class="wizard-panel">
      <h3>Review & Launch</h3>
      <div class="review-grid">
        <div class="review-item"><span class="rl">Name</span><span class="rv">{{ form.name }}</span></div>
        <div class="review-item"><span class="rl">Symbol</span><span class="rv">{{ form.symbol }}</span></div>
        <div class="review-item"><span class="rl">Supply</span><span class="rv">{{ form.supply?.toLocaleString() }}</span></div>
        <div class="review-item"><span class="rl">Decimals</span><span class="rv">{{ form.decimals }}</span></div>
        <div class="review-item"><span class="rl">Curve</span><span class="rv">{{ form.curveType }}</span></div>
        <div class="review-item"><span class="rl">Initial Price</span><span class="rv">{{ form.initialPrice }} {{ form.quoteToken }}</span></div>
        <div class="review-item"><span class="rl">Migration at</span><span class="rv">{{ form.migrationThreshold }} {{ form.quoteToken }}</span></div>
        <div class="review-item"><span class="rl">Quote Token</span><span class="rv">{{ form.quoteToken }}</span></div>
        <div class="review-item"><span class="rl">Creator Fee</span><span class="rv">{{ form.creatorFeePct }}%</span></div>
        <div class="review-item"><span class="rl">Initial Buy</span><span class="rv">{{ form.creatorInitialBuy || 0 }} {{ form.quoteToken }}</span></div>
        <div class="review-item" v-if="form.vestingEnabled"><span class="rl">Vesting</span><span class="rv">{{ form.vestingCliffDays }}d cliff / {{ form.vestingPeriodDays }}d total</span></div>
        <div class="review-item" v-if="form.twitter"><span class="rl">Twitter</span><span class="rv">{{ form.twitter }}</span></div>
        <div class="review-item" v-if="form.telegram"><span class="rl">Telegram</span><span class="rv">{{ form.telegram }}</span></div>
        <div class="review-item" v-if="form.website"><span class="rl">Website</span><span class="rv">{{ form.website }}</span></div>
      </div>
      <div class="launch-cost">
        Estimated cost: ~0.02 SOL rent + {{ LAUNCH_FEE_SOL }} SOL platform fee + {{ form.creatorInitialBuy || 0 }} {{ form.quoteToken }} initial buy
      </div>
    </div>

    <div class="wizard-actions">
      <button v-if="currentStep > 0" class="back-btn" @click="currentStep--">Back</button>
      <button v-if="currentStep < steps.length - 1" class="next-btn" @click="next" :disabled="!canProceed">Next</button>
      <button v-if="currentStep === steps.length - 1" class="launch-btn" @click="launch" :disabled="launching || !connected">
        {{ launching ? 'Launching...' : connected ? 'Launch Token' : 'Connect Wallet First' }}
      </button>
    </div>

    <div v-if="txResult" class="launch-result">
      <span class="success">Token launched!</span>
      <a :href="`https://solscan.io/tx/${txResult}`" target="_blank" class="tx-link">View transaction ↗</a>
    </div>
    <div v-if="error" class="launch-error">{{ error }}</div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSolanaConnection } from '../../composables/useSolanaWallet';

const LAUNCH_FEE_SOL    = parseFloat(process.env.VUE_APP_LAUNCH_FEE_SOL || '0.1');
const PLATFORM_WALLET   = process.env.VUE_APP_PLATFORM_WALLET || '';

export default {
  setup() {
    const store = useStore();
    const connected = computed(() => store.state.wallet.connected);
    const currentStep = ref(0);
    const launching = ref(false);
    const txResult = ref(null);
    const error = ref(null);

    const steps = ['Token Info', 'Bonding Curve', 'Tokenomics', 'Review & Launch'];
    const curves = [
      { type: 'linear',      icon: '📈', name: 'Linear',      desc: 'Price increases steadily' },
      { type: 'exponential', icon: '🚀', name: 'Exponential', desc: 'Slow start, rapid growth' },
      { type: 'logarithmic', icon: '📊', name: 'Logarithmic', desc: 'Fast start, then stabilizes' },
    ];

    const form = ref({
      name: '', symbol: '', description: '', supply: 1000000000, decimals: 6,
      logoUrl: '',
      twitter: '', telegram: '', website: '',
      curveType: 'linear', initialPrice: 0.000001, migrationThreshold: 85,
      quoteToken: 'SOL',
      creatorFeePct: 1,
      creatorInitialBuy: 0,
      vestingEnabled: false, vestingCliffDays: 0, vestingPeriodDays: 180,
    });

    const canProceed = computed(() => {
      if (currentStep.value === 0) return form.value.name && form.value.symbol && form.value.supply > 0;
      return true;
    });

    function next() { if (currentStep.value < steps.length - 1) currentStep.value++; }

    async function launch() {
      launching.value = true;
      error.value = null;
      try {
        // Step 1: Pay platform launch fee
        if (PLATFORM_WALLET && LAUNCH_FEE_SOL > 0) {
          const provider = window.phantom?.solana || window.solflare || window.solana;
          if (!provider) throw new Error('Wallet not found');
          const conn = getSolanaConnection();
          const walletPk = store.getters['wallet/publicKey'];
          const tx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: new PublicKey(walletPk),
              toPubkey:   new PublicKey(PLATFORM_WALLET),
              lamports:   Math.round(LAUNCH_FEE_SOL * LAMPORTS_PER_SOL),
            })
          );
          tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
          tx.feePayer = new PublicKey(walletPk);
          const signed = await provider.signTransaction(tx);
          await conn.sendRawTransaction(signed.serialize(), { skipPreflight: true });
        }

        // Step 2: Call backend launchpad route
        const { default: axios } = await import('axios');
        const { data } = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/api/launchpad/create`, form.value, {
          headers: { Authorization: `Bearer ${await store.getters.currentUser?.getIdToken()}` }
        });
        txResult.value = data.txid;
      } catch (e) {
        error.value = e.response?.data?.error || e.message;
      }
      launching.value = false;
    }

    return { steps, curves, form, currentStep, canProceed, next, launch, launching, txResult, error, connected, LAUNCH_FEE_SOL };
  }
};
</script>

<style scoped>
.launch-wizard { background: #0d1117; padding: 24px; max-width: 700px; margin: 0 auto; }
.wizard-steps { display: flex; gap: 0; margin-bottom: 32px; }
.step { display: flex; align-items: center; gap: 8px; flex: 1; padding: 8px 0; border-bottom: 2px solid #21262d; }
.step.active { border-bottom-color: #58a6ff; }
.step.done { border-bottom-color: #3fb950; }
.step-num { width: 24px; height: 24px; border-radius: 50%; background: #21262d; color: #8b949e; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }
.step.active .step-num { background: #1f6feb; color: #fff; }
.step.done .step-num { background: #3fb950; color: #fff; }
.step-label { font-size: 0.78rem; color: #8b949e; }
.step.active .step-label { color: #58a6ff; }
.wizard-panel h3 { color: #e6edf3; margin: 0 0 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 0.75rem; color: #8b949e; }
.form-input { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px 10px; color: #e6edf3; font-size: 0.85rem; outline: none; }
.form-input:focus { border-color: #58a6ff; }
textarea.form-input { resize: vertical; }
.curve-options { display: flex; gap: 12px; margin-bottom: 20px; }
.curve-option { flex: 1; padding: 14px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
.curve-option.active { border-color: #58a6ff; background: #1f6feb22; }
.curve-icon { font-size: 1.5rem; }
.curve-name { font-size: 0.85rem; font-weight: 600; color: #e6edf3; }
.curve-desc { font-size: 0.68rem; color: #8b949e; }
.review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.review-item { display: flex; justify-content: space-between; padding: 8px 12px; background: #161b22; border-radius: 6px; }
.rl { font-size: 0.75rem; color: #8b949e; }
.rv { font-size: 0.8rem; color: #e6edf3; font-weight: 600; }
.launch-cost { text-align: center; color: #8b949e; font-size: 0.8rem; margin-bottom: 8px; }
.wizard-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
.back-btn { padding: 10px 20px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; }
.next-btn { padding: 10px 24px; background: #1f6feb; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 600; }
.next-btn:disabled { opacity: 0.5; }
.launch-btn { padding: 10px 28px; background: #3fb950; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 700; font-size: 0.95rem; }
.launch-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.launch-result { margin-top: 16px; padding: 12px; background: #3fb95022; border: 1px solid #3fb950; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
.success { color: #3fb950; font-weight: 600; }
.tx-link { color: #58a6ff; text-decoration: none; font-size: 0.85rem; }
.launch-error { margin-top: 12px; padding: 10px; background: #f8514922; border: 1px solid #f85149; border-radius: 6px; color: #f85149; font-size: 0.82rem; }
.quote-options { display: flex; gap: 8px; }
.quote-btn { flex: 1; padding: 8px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
.quote-btn.active { border-color: #58a6ff; color: #58a6ff; background: rgba(88,166,255,0.1); }
.fee-options { display: flex; gap: 6px; flex-wrap: wrap; }
.fee-btn { padding: 7px 14px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; font-size: 0.82rem; }
.fee-btn.active { border-color: #3fb950; color: #3fb950; background: rgba(63,185,80,0.1); }
.form-hint { font-size: 0.7rem; color: #8b949e; margin-top: 4px; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.82rem; color: #e6edf3; }
.toggle-label input[type=checkbox] { accent-color: #58a6ff; }
.vesting-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; padding: 12px; background: #0d1117; border-radius: 6px; }
</style>
