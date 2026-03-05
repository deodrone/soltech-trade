<template>
  <div class="premium-gate-wrap">
    <!-- Pass-through when premium is active -->
    <slot v-if="isPremium" />

    <!-- Locked overlay when not premium -->
    <div v-else class="gate-locked">
      <div class="gate-overlay">
        <div class="gate-icon">👑</div>
        <div class="gate-title">Premium Feature</div>
        <div class="gate-desc">{{ description }}</div>
        <button class="gate-btn" @click="showModal = true">Unlock Premium</button>
      </div>
      <!-- Blurred preview of the slot content -->
      <div class="gate-blur" aria-hidden="true">
        <slot />
      </div>
    </div>

    <subscribe-modal v-if="showModal" @close="showModal = false" @subscribed="onSubscribed" />
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { usePremium } from '../../composables/usePremium';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import SubscribeModal from './SubscribeModal.vue';

export default {
  name: 'PremiumGate',
  components: { SubscribeModal },
  props: {
    description: { type: String, default: 'This feature requires a Soltech Premium subscription or holding $SOLTECH tokens.' },
  },
  setup() {
    const { isPremium, checkPremium } = usePremium();
    const { connected, publicKey } = useSolanaWallet();
    const showModal = ref(false);

    async function check() {
      if (publicKey.value) await checkPremium(publicKey.value);
    }

    function onSubscribed() { showModal.value = false; check(); }

    onMounted(check);
    watch(publicKey, check);

    return { isPremium, showModal, onSubscribed };
  },
};
</script>

<style scoped>
.premium-gate-wrap { position: relative; }
.gate-locked { position: relative; min-height: 120px; }
.gate-blur { filter: blur(4px); pointer-events: none; user-select: none; opacity: 0.4; }
.gate-overlay { position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(13,17,23,0.75); border-radius: 8px; padding: 20px; text-align: center; }
.gate-icon { font-size: 2rem; }
.gate-title { font-size: 1rem; font-weight: 700; color: #e6edf3; }
.gate-desc { font-size: 0.78rem; color: #8b949e; max-width: 280px; }
.gate-btn { padding: 8px 22px; background: linear-gradient(135deg, #1f6feb, #8957e5); border: none; border-radius: 8px; color: #fff; font-size: 0.85rem; font-weight: 700; cursor: pointer; margin-top: 4px; }
.gate-btn:hover { opacity: 0.9; }
</style>
