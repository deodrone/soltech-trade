import axios from 'axios';
import { ref, onUnmounted } from 'vue';
import { useStore } from 'vuex';

const API = process.env.VUE_APP_API_BASE_URL;

export function useAlerts() {
  const store = useStore();
  const ws = ref(null);

  async function loadAlerts() {
    try {
      const { data } = await axios.get(`${API}/api/alerts`);
      store.commit('alerts/SET_ALERTS', data);
      return data;
    } catch { return []; }
  }

  async function createAlert({ type, mint, symbol, condition, value }) {
    try {
      const { data } = await axios.post(`${API}/api/alerts`, { type, mint, symbol, condition, value });
      store.commit('alerts/ADD_ALERT', data);
      return data;
    } catch (e) { throw e; }
  }

  async function deleteAlert(id) {
    try {
      await axios.delete(`${API}/api/alerts/${id}`);
      store.commit('alerts/REMOVE_ALERT', id);
    } catch (e) { throw e; }
  }

  function connectWebSocket(token) {
    const wsUrl = API.replace('http', 'ws') + `/ws?token=${token}`;
    ws.value = new WebSocket(wsUrl);

    ws.value.onopen = () => store.commit('alerts/SET_WS_CONNECTED', true);
    ws.value.onclose = () => {
      store.commit('alerts/SET_WS_CONNECTED', false);
      setTimeout(() => connectWebSocket(token), 5000); // reconnect
    };
    ws.value.onmessage = ({ data }) => {
      try {
        const event = JSON.parse(data);
        if (event.type === 'alert_triggered') {
          store.commit('alerts/ADD_HISTORY', event.payload);
        }
      } catch { /* ignore */ }
    };
  }

  function disconnectWebSocket() {
    if (ws.value) { ws.value.onclose = null; ws.value.close(); ws.value = null; }
    store.commit('alerts/SET_WS_CONNECTED', false);
  }

  onUnmounted(disconnectWebSocket);

  return { loadAlerts, createAlert, deleteAlert, connectWebSocket, disconnectWebSocket };
}
