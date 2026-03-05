<template>
  <div class="analytics-page">
    <div class="analytics-header"><h1>Analytics</h1></div>

    <div class="analytics-tabs">
      <button :class="['tab', { active: tab === 'smartmoney' }]" @click="tab = 'smartmoney'">🐋 Smart Money</button>
      <button :class="['tab', { active: tab === 'copytrade' }]" @click="tab = 'copytrade'">📋 Copy Trade</button>
      <button :class="['tab', { active: tab === 'watchlist' }]" @click="tab = 'watchlist'">👁 Watchlist</button>
      <button :class="['tab', { active: tab === 'refer' }]" @click="tab = 'refer'">🔗 Refer & Earn</button>
    </div>

    <!-- Smart Money -->
    <div v-if="tab === 'smartmoney'" class="section">
      <div class="section-desc">Track the top-performing wallets on Solana. Enter a token address to see its best traders.</div>
      <div class="input-row">
        <input v-model="tokenInput" placeholder="Token mint address (e.g. So111...)" class="mint-input" />
        <button class="action-btn" @click="loadTraders">Analyze</button>
      </div>
      <smart-money :token-mint="analyzeToken" @copy="openCopySetup" />
    </div>

    <!-- Copy Trade -->
    <div v-if="tab === 'copytrade'" class="section">
      <div class="section-desc">Automatically mirror trades from top wallets in real-time.</div>
      <div class="input-row">
        <input v-model="copyWalletInput" placeholder="Source wallet address to copy..." class="mint-input" />
        <button class="action-btn" @click="openCopySetup(copyWalletInput)">+ Add Copy</button>
      </div>
      <copy-trade />
    </div>

    <!-- Watchlist -->
    <div v-if="tab === 'watchlist'" class="section">
      <div class="section-desc">Monitor wallet activity and get notified when they make trades.</div>
      <div class="input-row">
        <input v-model="watchInput" placeholder="Wallet address to watch..." class="mint-input" />
        <input v-model="watchLabel" placeholder="Label (optional)" class="mint-input small" />
        <button class="action-btn" @click="addWatch">Watch</button>
      </div>
      <div v-if="!watchedWallets.length" class="empty">No wallets being watched</div>
      <div v-for="w in watchedWallets" :key="w.address" class="watch-row">
        <div class="watch-info">
          <span class="watch-addr">{{ w.address?.slice(0,8) }}...{{ w.address?.slice(-4) }}</span>
          <span class="watch-label">{{ w.label }}</span>
        </div>
        <button class="copy-btn" @click="openCopySetup(w.address)">Copy Trade</button>
        <button class="remove-btn" @click="removeWatch(w.address)">✕</button>
      </div>
    </div>

    <!-- Refer & Earn -->
    <div v-if="tab === 'refer'" class="section refer-section">
      <div class="refer-hero">
        <div class="refer-icon">🔗</div>
        <div class="refer-title">Refer Friends, Grow Together</div>
        <div class="refer-sub">Share your referral link. Every friend who joins helps grow the Soltech ecosystem.</div>
      </div>
      <div v-if="!isLoggedIn" class="empty">Sign in to get your referral link</div>
      <template v-else>
        <div class="refer-link-row">
          <input readonly :value="referralLink" class="mint-input refer-input" />
          <button class="action-btn" @click="copyRefLink">{{ copied ? '✓ Copied!' : 'Copy Link' }}</button>
        </div>
        <div class="refer-share">
          <button class="share-x" @click="shareRef('twitter')">Share on 𝕏</button>
          <button class="share-tg" @click="shareRef('telegram')">Share on Telegram</button>
        </div>
        <div class="refer-stats">
          <div class="rstat"><span class="rv">{{ refStats.visits }}</span><span class="rl">Link Visits</span></div>
          <div class="rstat"><span class="rv">{{ refStats.signups }}</span><span class="rl">Signups</span></div>
        </div>
        <div class="refer-note">Share your link anywhere — Discord, Twitter, Reddit, crypto groups. Every visit is tracked.</div>
      </template>
    </div>

    <!-- Copy Setup Modal -->
    <teleport to="body">
      <div v-if="copyModal.open" class="modal-overlay" @click.self="copyModal.open = false">
        <div class="modal">
          <div class="modal-header"><span>Copy Trade Setup</span><button @click="copyModal.open = false">✕</button></div>
          <div class="modal-body">
            <label>Source Wallet</label>
            <input v-model="copyModal.wallet" class="modal-input" placeholder="Wallet address" />
            <label>Label</label>
            <input v-model="copyModal.label" class="modal-input" placeholder="Optional label" />
            <label>Max SOL per trade</label>
            <input v-model.number="copyModal.maxSol" class="modal-input" type="number" min="0.001" step="0.01" placeholder="0.1" />
            <label>Slippage %</label>
            <input v-model.number="copyModal.slippage" class="modal-input" type="number" min="0.1" max="50" step="0.1" placeholder="1" />
            <button class="action-btn full" @click="startCopy" :disabled="copying">{{ copying ? 'Starting...' : 'Start Copying' }}</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useSmartMoney } from '../composables/useSmartMoney';
import { useCopyTrade } from '../composables/useCopyTrade';
import { useToast } from '../composables/useToast';
import { useReferral } from '../composables/useReferral';
import SmartMoney from '../components/analytics/SmartMoney.vue';
import CopyTrade from '../components/analytics/CopyTrade.vue';

export default {
  components: { SmartMoney, CopyTrade },
  setup() {
    const store = useStore();
    const { trackWallet, untrackWallet, loadWatchedWallets } = useSmartMoney();
    const { startCopy, loading: copying } = useCopyTrade();
    const { show } = useToast();

    const { getReferralLink, getMyReferralStats, shareOnTwitter, shareOnTelegram, buildShareText, copyLink } = useReferral();
    const isLoggedIn = computed(() => store.getters.isLoggedIn);
    const uid = computed(() => store.getters.uid || store.getters['auth/uid'] || null);

    const tab = ref('smartmoney');
    const tokenInput = ref('');
    const analyzeToken = ref('');
    const copyWalletInput = ref('');
    const watchInput = ref('');
    const watchLabel = ref('');
    const watchedWallets = computed(() => store.getters['analytics/watchedWallets']);
    const copyModal = ref({ open: false, wallet: '', label: '', maxSol: 0.1, slippage: 1 });

    // Referral
    const referralLink = ref('');
    const refStats = ref({ visits: 0, signups: 0 });
    const copied = ref(false);

    onMounted(async () => {
      if (isLoggedIn.value && uid.value) {
        referralLink.value = await getReferralLink(uid.value);
        refStats.value = await getMyReferralStats();
      }
    });

    async function copyRefLink() {
      await copyLink(referralLink.value);
      copied.value = true;
      setTimeout(() => { copied.value = false; }, 2000);
    }

    function shareRef(platform) {
      const text = buildShareText(referralLink.value, 'trade');
      if (platform === 'twitter') shareOnTwitter(text);
      else shareOnTelegram(text);
    }

    function loadTraders() { analyzeToken.value = tokenInput.value.trim(); }
    function openCopySetup(wallet) { copyModal.value = { open: true, wallet, label: '', maxSol: 0.1, slippage: 1 }; tab.value = 'copytrade'; }

    async function addWatch() {
      if (!watchInput.value.trim()) return;
      try {
        await trackWallet(watchInput.value.trim(), watchLabel.value);
        watchInput.value = ''; watchLabel.value = '';
        show({ message: 'Wallet added to watchlist', type: 'success' });
      } catch (e) { show({ message: e.message, type: 'error' }); }
    }

    async function removeWatch(addr) {
      await untrackWallet(addr);
      show({ message: 'Wallet removed', type: 'info' });
    }

    async function startCopyTrade() {
      if (!copyModal.value.wallet) return;
      try {
        await startCopy({ sourceWallet: copyModal.value.wallet, label: copyModal.value.label, maxSolPerTrade: copyModal.value.maxSol, slippage: copyModal.value.slippage });
        copyModal.value.open = false;
        show({ message: 'Copy trade started!', type: 'success' });
      } catch (e) { show({ message: e.message, type: 'error' }); }
    }

    loadWatchedWallets();

    return { tab, tokenInput, analyzeToken, copyWalletInput, watchInput, watchLabel, watchedWallets, copyModal, copying, loadTraders, openCopySetup, addWatch, removeWatch, startCopy: startCopyTrade, isLoggedIn, referralLink, refStats, copied, copyRefLink, shareRef };
  },
};
</script>

<style scoped>
.analytics-page { padding: 24px; background: #0d1117; min-height: calc(100vh - 48px); }
.analytics-header h1 { font-size: 1.3rem; color: #e6edf3; margin: 0 0 20px; }
.analytics-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #21262d; }
.tab { padding: 8px 16px; background: none; border: none; border-bottom: 2px solid transparent; color: #8b949e; cursor: pointer; font-size: 0.85rem; margin-bottom: -1px; }
.tab.active { color: #58a6ff; border-bottom-color: #58a6ff; }
.section { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; }
.section-desc { color: #8b949e; font-size: 0.82rem; margin-bottom: 12px; }
.input-row { display: flex; gap: 8px; margin-bottom: 14px; }
.mint-input { flex: 1; padding: 8px 12px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 0.85rem; outline: none; }
.mint-input:focus { border-color: #58a6ff; }
.mint-input.small { max-width: 150px; }
.action-btn { padding: 8px 16px; background: #238636; border: none; color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.85rem; white-space: nowrap; }
.action-btn:hover { background: #2ea043; }
.action-btn.full { width: 100%; margin-top: 12px; }
.empty { padding: 24px; text-align: center; color: #8b949e; }
.watch-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #21262d; }
.watch-info { flex: 1; }
.watch-addr { font-family: monospace; font-size: 0.82rem; color: #58a6ff; display: block; }
.watch-label { font-size: 0.72rem; color: #8b949e; }
.copy-btn { padding: 4px 12px; background: rgba(88,166,255,0.12); border: 1px solid #58a6ff; color: #58a6ff; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
.remove-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 4px 8px; cursor: pointer; }
.remove-btn:hover { border-color: #f85149; color: #f85149; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 500; display: flex; align-items: center; justify-content: center; }
.modal { background: #161b22; border: 1px solid #30363d; border-radius: 10px; width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #21262d; font-weight: 600; color: #e6edf3; }
.modal-header button { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 1rem; }
.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 8px; }
.modal-body label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; }
.modal-input { padding: 8px 12px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 0.85rem; outline: none; }

/* Refer & Earn */
.refer-section { display: flex; flex-direction: column; gap: 16px; }
.refer-hero { text-align: center; padding: 8px 0 4px; }
.refer-icon { font-size: 2.2rem; margin-bottom: 8px; }
.refer-title { font-size: 1.1rem; font-weight: 700; color: #e6edf3; margin-bottom: 6px; }
.refer-sub { font-size: 0.82rem; color: #8b949e; }
.refer-link-row { display: flex; gap: 8px; }
.refer-input { font-family: monospace; font-size: 0.78rem; color: #58a6ff; }
.refer-share { display: flex; gap: 8px; }
.share-x { flex: 1; padding: 10px; background: #000; border: 1px solid #30363d; color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
.share-x:hover { background: #1a1a1a; }
.share-tg { flex: 1; padding: 10px; background: rgba(0,136,204,0.15); border: 1px solid rgba(0,136,204,0.4); color: #0088cc; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
.share-tg:hover { background: rgba(0,136,204,0.25); }
.refer-stats { display: flex; gap: 24px; justify-content: center; padding: 16px; background: #0d1117; border-radius: 8px; }
.rstat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.rv { font-size: 1.8rem; font-weight: 800; color: #58a6ff; }
.rl { font-size: 0.72rem; color: #8b949e; text-transform: uppercase; }
.refer-note { font-size: 0.75rem; color: #484f58; text-align: center; }
</style>
