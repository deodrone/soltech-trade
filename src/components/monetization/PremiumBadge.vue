<template>
  <div class="premium-badge-wrap">
    <!-- Already premium -->
    <div v-if="isPremium" class="badge premium" :title="badgeTitle">
      👑 Premium
      <span v-if="premiumStatus.method === 'token'" class="badge-sub">$SOLTECH</span>
      <span v-else-if="premiumStatus.expiresAt" class="badge-sub">{{ daysLeft }}d left</span>
    </div>

    <!-- Not premium -->
    <button v-else class="badge upgrade" @click="showModal = true">
      ⚡ Upgrade
    </button>

    <subscribe-modal v-if="showModal" @close="showModal = false" @subscribed="showModal = false" />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { usePremium } from '../../composables/usePremium';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import SubscribeModal from './SubscribeModal.vue';

export default {
  name: 'PremiumBadge',
  components: { SubscribeModal },
  setup() {
    const { isPremium, premiumStatus, checkPremium } = usePremium();
    const { connected, publicKey } = useSolanaWallet();
    const showModal = ref(false);

    const daysLeft = computed(() => {
      if (!premiumStatus.value.expiresAt) return 0;
      return Math.max(0, Math.ceil((new Date(premiumStatus.value.expiresAt) - Date.now()) / 86400000));
    });

    const badgeTitle = computed(() =>
      premiumStatus.value.method === 'token'
        ? `Premium via $SOLTECH (${premiumStatus.value.balance?.toLocaleString()} tokens)`
        : `Subscription expires ${new Date(premiumStatus.value.expiresAt).toLocaleDateString()}`
    );

    async function check() {
      if (publicKey.value) await checkPremium(publicKey.value);
    }

    onMounted(check);
    watch(publicKey, check);

    return { isPremium, premiumStatus, showModal, daysLeft, badgeTitle };
  },
};
</script>

<style scoped>
.premium-badge-wrap { display: flex; align-items: center; }
.badge { display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
.badge.premium { background: linear-gradient(135deg, rgba(31,111,235,0.2), rgba(137,87,229,0.2)); border: 1px solid #8957e5; color: #c9b3f5; cursor: default; }
.badge-sub { font-size: 0.65rem; color: #8b949e; font-weight: 400; }
.badge.upgrade { background: linear-gradient(135deg, #1f6feb22, #8957e522); border: 1px solid #1f6feb; color: #58a6ff; cursor: pointer; transition: all 0.15s; }
.badge.upgrade:hover { background: linear-gradient(135deg, #1f6feb44, #8957e544); }
</style>
