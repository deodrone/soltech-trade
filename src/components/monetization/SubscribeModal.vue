<template>
  <teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="subscribe-modal">
        <button class="close-btn" @click="$emit('close')">✕</button>

        <!-- Header -->
        <div class="modal-header">
          <div class="crown">👑</div>
          <h2>Soltech Premium</h2>
          <p class="sub-line">Unlock the full platform</p>
        </div>

        <!-- Features list -->
        <div class="features">
          <div class="feature-row"><span class="fcheck">✓</span><span>🎯 Sniper auto-buy new launches</span></div>
          <div class="feature-row"><span class="fcheck">✓</span><span>📈 DCA recurring orders</span></div>
          <div class="feature-row"><span class="fcheck">✓</span><span>🛑 Stop Loss / Take Profit</span></div>
          <div class="feature-row"><span class="fcheck">✓</span><span>🔔 Unlimited price alerts</span></div>
          <div class="feature-row"><span class="fcheck">✓</span><span>🐋 Copy trade unlimited wallets</span></div>
          <div class="feature-row"><span class="fcheck">✓</span><span>📊 Advanced token filters</span></div>
        </div>

        <!-- Two paths -->
        <div class="paths">
          <!-- Token path -->
          <div class="path-card token-path" :class="{ available: !soltechMint }">
            <div class="path-icon">🪙</div>
            <div class="path-title">Hold $SOLTECH</div>
            <div class="path-detail">{{ fmtNum(tokenThreshold) }}+ tokens = lifetime premium</div>
            <div v-if="tokenBalance > 0" class="token-bal">You have: {{ fmtNum(tokenBalance) }} $SOLTECH</div>
            <div v-if="!soltechMint" class="path-note">$SOLTECH launching soon</div>
            <a v-else :href="`https://solscan.io/token/${soltechMint}`" target="_blank" class="path-link">Buy $SOLTECH ↗</a>
          </div>

          <!-- Subscription path -->
          <div class="path-card sub-path">
            <div class="path-icon">💳</div>
            <div class="path-title">Subscribe</div>
            <div class="path-detail">{{ subscriptionPrice }} SOL / 30 days</div>
            <div class="path-note">Paid directly on-chain to platform wallet</div>
            <button
              class="pay-btn"
              :disabled="!connected || paying"
              @click="handlePay"
            >
              <span v-if="paying">Processing...</span>
              <span v-else-if="!connected">Connect Wallet</span>
              <span v-else>Pay {{ subscriptionPrice }} SOL</span>
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

        <div class="footer-note">
          All payments go directly on-chain to the platform wallet. No middlemen.
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, onMounted } from 'vue';
import { usePremium } from '../../composables/usePremium';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import { useToast } from '../../composables/useToast';

export default {
  name: 'SubscribeModal',
  emits: ['close', 'subscribed'],
  setup(_, { emit }) {
    const { paySubscription, registerSubscription, checkPremium, checkTokenBalance,
            SUBSCRIPTION_PRICE_SOL, PREMIUM_TOKEN_THRESHOLD, SOLTECH_MINT } = usePremium();
    const { connected, publicKey } = useSolanaWallet();
    const { show } = useToast();

    const paying = ref(false);
    const errorMsg = ref('');
    const successMsg = ref('');
    const tokenBalance = ref(0);

    const subscriptionPrice = SUBSCRIPTION_PRICE_SOL;
    const tokenThreshold = PREMIUM_TOKEN_THRESHOLD;
    const soltechMint = SOLTECH_MINT;

    // Get wallet provider for signing
    function getProvider() {
      return window.phantom?.solana || window.solflare || window.solana;
    }

    async function handlePay() {
      if (!connected.value) return;
      paying.value = true; errorMsg.value = ''; successMsg.value = '';
      try {
        const provider = getProvider();
        if (!provider) throw new Error('No wallet found');
        const txid = await paySubscription(publicKey.value, provider);
        await registerSubscription(publicKey.value, txid);
        await checkPremium(publicKey.value);
        successMsg.value = `Subscribed! TX: ${txid.slice(0, 12)}...`;
        show({ message: 'Premium activated! Enjoy the full platform.', type: 'success' });
        setTimeout(() => emit('subscribed'), 1500);
      } catch (e) {
        errorMsg.value = e.message;
        show({ message: `Payment failed: ${e.message}`, type: 'error' });
      } finally { paying.value = false; }
    }

    onMounted(async () => {
      if (publicKey.value) {
        tokenBalance.value = await checkTokenBalance(publicKey.value);
      }
    });

    const fmtNum = n => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : n;

    return { connected, paying, errorMsg, successMsg, tokenBalance, subscriptionPrice, tokenThreshold, soltechMint, handlePay, fmtNum };
  },
};
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.subscribe-modal { background: #161b22; border: 1px solid #30363d; border-radius: 16px; width: 100%; max-width: 520px; padding: 28px; position: relative; }
.close-btn { position: absolute; top: 14px; right: 16px; background: none; border: none; color: #8b949e; font-size: 1.1rem; cursor: pointer; }
.close-btn:hover { color: #f85149; }
.modal-header { text-align: center; margin-bottom: 20px; }
.crown { font-size: 2.5rem; }
.modal-header h2 { font-size: 1.5rem; color: #e6edf3; margin: 6px 0 4px; }
.sub-line { color: #8b949e; font-size: 0.88rem; }
.features { background: #0d1117; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 7px; }
.feature-row { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #e6edf3; }
.fcheck { color: #3fb950; font-weight: 700; }
.paths { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.path-card { background: #0d1117; border: 1px solid #30363d; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.token-path { border-color: #d29922; }
.sub-path { border-color: #58a6ff; }
.path-icon { font-size: 1.8rem; }
.path-title { font-weight: 700; font-size: 0.9rem; color: #e6edf3; }
.path-detail { font-size: 0.78rem; color: #8b949e; }
.path-note { font-size: 0.7rem; color: #8b949e; font-style: italic; }
.token-bal { font-size: 0.75rem; color: #3fb950; font-weight: 600; }
.path-link { font-size: 0.78rem; color: #58a6ff; text-decoration: none; }
.path-link:hover { text-decoration: underline; }
.pay-btn { margin-top: 6px; padding: 9px 20px; background: #1f6feb; border: none; border-radius: 8px; color: #fff; font-size: 0.85rem; font-weight: 700; cursor: pointer; width: 100%; }
.pay-btn:hover:not(:disabled) { background: #388bfd; }
.pay-btn:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
.error-msg { color: #f85149; font-size: 0.78rem; text-align: center; margin-bottom: 8px; }
.success-msg { color: #3fb950; font-size: 0.78rem; text-align: center; margin-bottom: 8px; }
.footer-note { text-align: center; font-size: 0.7rem; color: #8b949e; border-top: 1px solid #21262d; padding-top: 12px; }
</style>
