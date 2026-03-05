<template>
  <div class="alert-manager">
    <div class="am-header">
      <span>Manage Alerts</span>
      <button class="add-btn" @click="showAdd = true">+ New Alert</button>
    </div>

    <!-- Create alert modal -->
    <div v-if="showAdd" class="modal-overlay" @click.self="showAdd = false">
      <div class="modal">
        <h3>Create Alert</h3>
        <div class="form-group">
          <label>Type</label>
          <div class="type-tabs">
            <button :class="['type-tab', { active: form.type === 'price' }]" @click="form.type = 'price'">Price Alert</button>
            <button :class="['type-tab', { active: form.type === 'wallet' }]" @click="form.type = 'wallet'">Wallet Alert</button>
          </div>
        </div>

        <div v-if="form.type === 'price'" class="form-group">
          <label>Token Mint</label>
          <input v-model="form.mint" placeholder="Token mint address..." class="form-input" />
        </div>
        <div v-if="form.type === 'wallet'" class="form-group">
          <label>Wallet Address</label>
          <input v-model="form.wallet" placeholder="Solana wallet address..." class="form-input" />
        </div>

        <div v-if="form.type === 'price'" class="form-row">
          <div class="form-group half">
            <label>Condition</label>
            <select v-model="form.condition" class="form-input">
              <option value="above">Price Above</option>
              <option value="below">Price Below</option>
              <option value="change_up">% Change Up</option>
              <option value="change_down">% Change Down</option>
            </select>
          </div>
          <div class="form-group half">
            <label>Value</label>
            <input v-model.number="form.value" type="number" min="0" step="any" class="form-input" :placeholder="form.condition.includes('change') ? 'e.g. 10 (%)' : 'e.g. 0.50'" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showAdd = false">Cancel</button>
          <button class="confirm-btn" @click="create" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create Alert' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!alerts.length" class="empty">No alerts configured</div>

    <div v-else class="alerts-list">
      <div v-for="a in alerts" :key="a._id" class="alert-row">
        <span class="alert-icon">{{ a.type === 'price' ? '💰' : '🐋' }}</span>
        <div class="alert-info">
          <span class="alert-desc">{{ describeAlert(a) }}</span>
          <span class="alert-mint">{{ a.type === 'price' ? shortAddr(a.mint) : shortAddr(a.wallet) }}</span>
        </div>
        <span :class="['alert-status', a.active ? 'active' : 'inactive']">{{ a.active ? 'Active' : 'Off' }}</span>
        <button class="del-btn" @click="del(a._id)" title="Delete">✕</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useAlerts } from '../../composables/useAlerts';

export default {
  setup() {
    const { alerts, loading, fetchAlerts, createAlert, deleteAlert } = useAlerts();
    const showAdd = ref(false);
    const form = ref({ type: 'price', mint: '', wallet: '', condition: 'above', value: 0 });

    async function create() {
      await createAlert({ ...form.value });
      form.value = { type: 'price', mint: '', wallet: '', condition: 'above', value: 0 };
      showAdd.value = false;
    }

    async function del(id) { await deleteAlert(id); }

    function describeAlert(a) {
      if (a.type === 'wallet') return 'Wallet activity';
      const condMap = { above: 'Price above', below: 'Price below', change_up: '% up by', change_down: '% down by' };
      return `${condMap[a.condition] || a.condition} $${a.value}`;
    }

    function shortAddr(addr) { return addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : ''; }

    onMounted(fetchAlerts);

    return { alerts, loading, showAdd, form, create, del, describeAlert, shortAddr };
  }
};
</script>

<style scoped>
.alert-manager { background: #0d1117; }
.am-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #21262d; font-weight: 600; color: #e6edf3; }
.add-btn { padding: 5px 12px; background: #1f6feb; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-size: 0.8rem; }
.empty { padding: 40px; text-align: center; color: #8b949e; }
.alerts-list { padding: 8px 0; }
.alert-row { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #161b22; }
.alert-row:hover { background: #161b22; }
.alert-icon { font-size: 1.1rem; }
.alert-info { flex: 1; display: flex; flex-direction: column; }
.alert-desc { font-size: 0.82rem; color: #e6edf3; }
.alert-mint { font-size: 0.68rem; color: #8b949e; font-family: monospace; }
.alert-status { font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }
.alert-status.active { background: #3fb95033; color: #3fb950; }
.alert-status.inactive { background: #30363d; color: #8b949e; }
.del-btn { background: none; border: none; color: #f85149; cursor: pointer; font-size: 0.85rem; }
.modal-overlay { position: fixed; inset: 0; background: #00000088; z-index: 200; display: flex; align-items: center; justify-content: center; }
.modal { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 24px; width: 440px; max-width: 90vw; }
.modal h3 { margin: 0 0 16px; color: #e6edf3; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.form-group label { font-size: 0.75rem; color: #8b949e; }
.type-tabs { display: flex; gap: 8px; }
.type-tab { padding: 6px 14px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; font-size: 0.8rem; }
.type-tab.active { border-color: #58a6ff; color: #58a6ff; }
.form-row { display: flex; gap: 12px; }
.half { flex: 1; }
.form-input { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 8px 10px; color: #e6edf3; font-size: 0.85rem; outline: none; width: 100%; }
.form-input:focus { border-color: #58a6ff; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.cancel-btn { padding: 8px 16px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; cursor: pointer; }
.confirm-btn { padding: 8px 20px; background: #1f6feb; border: none; border-radius: 6px; color: #fff; cursor: pointer; }
.confirm-btn:disabled { opacity: 0.5; }
</style>
