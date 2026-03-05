import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useToast } from './useToast';
import api from '../config/api';

export function useAlerts() {
  const store = useStore();
  const { show } = useToast();
  const loading = ref(false);

  const alerts = computed(() => store.getters['alerts/activeAlerts']);

  async function fetchAlerts() {
    loading.value = true;
    try {
      const { data } = await api.get('/api/alerts');
      store.commit('alerts/SET_ALERTS', data);
      return data;
    } catch { return []; }
    finally { loading.value = false; }
  }

  async function createAlert({ type, mint, condition, value, wallet }) {
    const { data } = await api.post('/api/alerts', { type, mint, condition, value, wallet });
    store.commit('alerts/ADD_ALERT', data);
    return data;
  }

  async function toggleAlert(id, active) {
    const { data } = await api.patch(`/api/alerts/${id}`, { active });
    return data;
  }

  async function deleteAlert(id) {
    await api.delete(`/api/alerts/${id}`);
    store.commit('alerts/REMOVE_ALERT', id);
  }

  function handleWsEvent(msg) {
    if (!msg?.type) return;

    if (msg.type === 'alert_triggered') {
      const { mint, condition, value, currentPrice } = msg.alert || {};
      store.commit('alerts/ADD_HISTORY', {
        ...msg,
        message: `Alert: ${mint?.slice(0, 6)} price ${condition} $${value} (now $${currentPrice?.toFixed(6)})`,
        receivedAt: Date.now(),
      });
      show({
        message: `Alert triggered: ${mint?.slice(0, 6)} price ${condition} $${value} (now $${currentPrice?.toFixed(6)})`,
        type: 'warning',
        duration: 8000,
      });
    }

    if (msg.type === 'sl_tp_triggered') {
      const { triggerType, mint, price, amount } = msg;
      const label = triggerType === 'stop_loss' ? 'Stop Loss' : 'Take Profit';
      store.commit('alerts/ADD_HISTORY', {
        ...msg,
        message: `${label} triggered for ${mint?.slice(0, 8)}... at $${parseFloat(price).toFixed(6)} — sell ${amount} SOL`,
        receivedAt: Date.now(),
      });
      show({
        message: `${label} triggered for ${mint?.slice(0, 8)}... at $${parseFloat(price).toFixed(6)} — open Trade to sell ${amount} SOL`,
        type: triggerType === 'stop_loss' ? 'error' : 'success',
        duration: 12000,
      });
    }

    if (msg.type === 'whale_trade') {
      store.commit('alerts/ADD_HISTORY', {
        ...msg,
        message: `Whale trade: ${msg.wallet?.slice(0, 8)}... bought ${msg.amount} SOL of ${msg.mint?.slice(0, 6)}`,
        receivedAt: Date.now(),
      });
    }
  }

  return { alerts, loading, fetchAlerts, createAlert, toggleAlert, deleteAlert, handleWsEvent };
}
