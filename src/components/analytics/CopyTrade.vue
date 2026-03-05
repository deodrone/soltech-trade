<template>
  <div class="copy-trade">
    <div class="ct-header">
      <span>Copy Trade</span>
      <button class="add-btn" @click="showAdd = true">+ Add Wallet</button>
    </div>

    <!-- Add wallet modal -->
    <div v-if="showAdd" class="modal-overlay" @click.self="showAdd = false">
      <div class="modal">
        <h3>Add Copy Trade</h3>
        <div class="form-group">
          <label>Wallet Address</label>
          <input v-model="form.wallet" placeholder="Solana wallet address..." class="form-input" />
        </div>
        <div class="form-group">
          <label>Label (optional)</label>
          <input v-model="form.label" placeholder="e.g. Whale Wallet #1" class="form-input" />
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label>Max SOL per trade</label>
            <input v-model.number="form.maxSol" type="number" min="0.01" step="0.1" class="form-input" />
          </div>
          <div class="form-group half">
            <label>Slippage %</label>
            <input v-model.number="form.slippage" type="number" min="0.1" max="50" step="0.1" class="form-input" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showAdd = false">Cancel</button>
          <button class="confirm-btn" @click="addCopy" :disabled="!form.wallet || loading">
            {{ loading ? 'Saving...' : 'Start Copying' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!copies.length" class="empty">No copy trades configured. Add a wallet to mirror.</div>

    <div v-else class="copies-list">
      <div v-for="c in copies" :key="c._id" class="copy-row">
        <div class="cr-left">
          <span class="cr-label">{{ c.label || shortAddr(c.sourceWallet) }}</span>
          <span class="cr-addr">{{ shortAddr(c.sourceWallet) }}</span>
        </div>
        <div class="cr-settings">
          <span class="cr-setting">Max {{ c.maxSol }} SOL</span>
          <span class="cr-setting">{{ c.slippage }}% slip</span>
        </div>
        <div class="cr-status" :class="c.active ? 'active' : 'paused'">
          {{ c.active ? 'Live' : 'Paused' }}
        </div>
        <div class="cr-actions">
          <button class="toggle-btn" @click="toggle(c)">{{ c.active ? 'Pause' : 'Resume' }}</button>
          <button class="stop-btn" @click="remove(c._id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useCopyTrade } from '../../composables/useCopyTrade';

export default {
  setup() {
    const { copies, loading, fetchCopies, startCopy, stopCopy, getCopyStatus } = useCopyTrade();
    const showAdd = ref(false);
    const form = ref({ wallet: '', label: '', maxSol: 0.5, slippage: 1.0 });

    async function addCopy() {
      await startCopy({ sourceWallet: form.value.wallet, label: form.value.label, maxSol: form.value.maxSol, slippage: form.value.slippage });
      form.value = { wallet: '', label: '', maxSol: 0.5, slippage: 1.0 };
      showAdd.value = false;
    }

    async function toggle(c) {
      // Toggle via API — for now just update local state
      c.active = !c.active;
    }

    async function remove(id) {
      await stopCopy(id);
    }

    function shortAddr(addr) { return addr ? `${addr.slice(0,4)}...${addr.slice(-4)}` : ''; }

    onMounted(fetchCopies);

    return { copies, loading, showAdd, form, addCopy, toggle, remove, shortAddr };
  }
};
</script>

<style scoped>
.copy-trade { background: #0d1117; }
.ct-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #21262d; font-weight: 600; color: #e6edf3; }
.add-btn { padding: 5px 12px; background: #1f6feb; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-size: 0.8rem; }
.empty { padding: 40px; text-align: center; color: #8b949e; }
.copies-list { padding: 8px 0; }
.copy-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #161b22; }
.copy-row:hover { background: #161b22; }
.cr-left { flex: 1; display: flex; flex-direction: column; }
.cr-label { font-size: 0.85rem; color: #e6edf3; font-weight: 600; }
.cr-addr { font-size: 0.68rem; color: #8b949e; font-family: monospace; }
.cr-settings { display: flex; gap: 6px; }
.cr-setting { font-size: 0.72rem; padding: 2px 6px; background: #21262d; border-radius: 4px; color: #8b949e; }
.cr-status { font-size: 0.72rem; padding: 2px 8px; border-radius: 10px; }
.cr-status.active { background: #3fb95033; color: #3fb950; }
.cr-status.paused { background: #f8514933; color: #f85149; }
.toggle-btn { padding: 4px 10px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #8b949e; cursor: pointer; font-size: 0.75rem; }
.stop-btn { padding: 4px 8px; background: none; border: none; color: #f85149; cursor: pointer; font-size: 0.85rem; }
.modal-overlay { position: fixed; inset: 0; background: #00000088; z-index: 200; display: flex; align-items: center; justify-content: center; }
.modal { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 24px; width: 420px; max-width: 90vw; }
.modal h3 { margin: 0 0 16px; color: #e6edf3; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.form-group label { font-size: 0.75rem; color: #8b949e; }
.form-row { display: flex; gap: 12px; }
.half { flex: 1; }
.form-input { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px 10px; color: #e6edf3; font-size: 0.85rem; outline: none; }
.form-input:focus { border-color: #58a6ff; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.cancel-btn { padding: 8px 16px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; }
.confirm-btn { padding: 8px 20px; background: #1f6feb; border: none; border-radius: 6px; color: #fff; cursor: pointer; }
.confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
