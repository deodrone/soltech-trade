<template>
  <div class="wallet-connect">
    <button v-if="!connected" class="connect-btn" @click="showModal = true">
      Connect Wallet
    </button>
    <div v-else class="wallet-info" @click="showModal = true">
      <span class="dot" />
      <span class="key">{{ shortKey }}</span>
      <span class="sol">{{ balanceSol.toFixed(3) }} SOL</span>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <span>{{ connected ? 'Wallet' : 'Connect Wallet' }}</span>
            <button class="close" @click="showModal = false">✕</button>
          </div>

          <div v-if="!connected" class="wallet-list">
            <button
              v-for="w in wallets"
              :key="w.name"
              class="wallet-option"
              @click="connect(w.name)"
              :disabled="connecting"
            >
              <img :src="w.icon" :alt="w.name" class="wallet-icon" @error="$event.target.style.display='none'" />
              <span>{{ w.name }}</span>
              <span v-if="w.installUrl" class="install-hint">Install →</span>
            </button>
          </div>

          <div v-else class="connected-info">
            <div class="address">{{ publicKey }}</div>
            <div class="balance">{{ balanceSol.toFixed(4) }} SOL</div>
            <button class="disconnect-btn" @click="disconnect">Disconnect</button>
          </div>

          <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useSolanaWallet } from '../../composables/useSolanaWallet';
import { useToast } from '../../composables/useToast';

export default {
  setup() {
    const { connected, publicKey, shortKey, balanceSol, connectWallet, disconnectWallet, getAvailableWallets } = useSolanaWallet();
    const { show } = useToast();
    const showModal = ref(false);
    const connecting = ref(false);
    const errorMsg = ref('');
    const wallets = getAvailableWallets();

    async function connect(name) {
      connecting.value = true; errorMsg.value = '';
      try {
        await connectWallet(name);
        show({ message: `${name} connected!`, type: 'success' });
        showModal.value = false;
      } catch (e) {
        errorMsg.value = e.message;
        if (e.message.includes('not found')) {
          window.open(wallets.find(w => w.name === name)?.installUrl || '#', '_blank');
        }
      } finally { connecting.value = false; }
    }

    async function disconnect() {
      await disconnectWallet();
      showModal.value = false;
      show({ message: 'Wallet disconnected', type: 'info' });
    }

    return { connected, publicKey, shortKey, balanceSol, wallets, showModal, connecting, errorMsg, connect, disconnect };
  },
};
</script>

<style scoped>
.connect-btn {
  padding: 7px 16px; background: #238636; color: #fff; border: none;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
  transition: background 0.15s;
}
.connect-btn:hover { background: #2ea043; }
.wallet-info {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  padding: 6px 12px; background: #21262d; border: 1px solid #30363d;
  border-radius: 6px; font-size: 0.82rem;
}
.dot { width: 8px; height: 8px; background: #3fb950; border-radius: 50%; }
.key { color: #e6edf3; font-family: monospace; }
.sol { color: #8b949e; }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: #161b22; border: 1px solid #30363d; border-radius: 12px;
  width: 360px; padding: 24px;
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-weight: 600; font-size: 1rem; color: #e6edf3; }
.close { background: none; border: none; color: #8b949e; font-size: 1rem; cursor: pointer; }
.wallet-list { display: flex; flex-direction: column; gap: 8px; }
.wallet-option {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  background: #21262d; border: 1px solid #30363d; border-radius: 8px;
  cursor: pointer; color: #e6edf3; font-size: 0.9rem; font-weight: 500;
  transition: border-color 0.15s;
}
.wallet-option:hover { border-color: #58a6ff; }
.wallet-option:disabled { opacity: 0.6; cursor: not-allowed; }
.wallet-icon { width: 28px; height: 28px; border-radius: 6px; }
.install-hint { margin-left: auto; color: #8b949e; font-size: 0.75rem; }
.connected-info { text-align: center; padding: 12px 0; }
.address { font-family: monospace; font-size: 0.75rem; color: #8b949e; word-break: break-all; margin-bottom: 8px; }
.balance { font-size: 1.2rem; font-weight: 700; color: #e6edf3; margin-bottom: 16px; }
.disconnect-btn { padding: 8px 20px; background: transparent; border: 1px solid #f85149; color: #f85149; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.disconnect-btn:hover { background: rgba(248,81,73,0.1); }
.error { margin-top: 12px; color: #f85149; font-size: 0.8rem; text-align: center; }
</style>
