import axios from 'axios';
import { ref } from 'vue';
import { useStore } from 'vuex';

const API = process.env.VUE_APP_API_BASE_URL;

export function useCopyTrade() {
  const store = useStore();
  const loading = ref(false);

  async function getCopyTrades() {
    try {
      const { data } = await axios.get(`${API}/api/copy-trade`);
      store.commit('analytics/SET_COPY_TRADES', data);
      return data;
    } catch { return []; }
  }

  async function startCopy({ sourceWallet, slippage = 1, maxSolPerTrade = 0.1, tokens = [], label = '' }) {
    loading.value = true;
    try {
      const { data } = await axios.post(`${API}/api/copy-trade`, { sourceWallet, slippage, maxSolPerTrade, tokens, label });
      await getCopyTrades();
      return data;
    } catch (e) { throw e; }
    finally { loading.value = false; }
  }

  async function stopCopy(id) {
    try {
      await axios.delete(`${API}/api/copy-trade/${id}`);
      await getCopyTrades();
    } catch (e) { throw e; }
  }

  async function updateCopy(id, settings) {
    try {
      const { data } = await axios.patch(`${API}/api/copy-trade/${id}`, settings);
      await getCopyTrades();
      return data;
    } catch (e) { throw e; }
  }

  return { loading, getCopyTrades, startCopy, stopCopy, updateCopy };
}
