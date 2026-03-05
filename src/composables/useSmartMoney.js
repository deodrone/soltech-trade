import axios from 'axios';
import { ref } from 'vue';
import { useStore } from 'vuex';

const API = process.env.VUE_APP_API_BASE_URL;

export function useSmartMoney() {
  const store = useStore();
  const loading = ref(false);

  async function getTopWallets(tokenMint, limit = 20) {
    try {
      const { data } = await axios.get(`${API}/api/birdeye/token_top_traders`, {
        params: { address: tokenMint, time_frame: '24h', sort_type: 'desc', sort_by: 'volume', limit }
      });
      return data.data?.items || [];
    } catch { return []; }
  }

  async function getWalletTrades(walletAddress, limit = 50) {
    try {
      const { data } = await axios.get(`${API}/api/birdeye/wallet_tx_list`, {
        params: { wallet: walletAddress, limit }
      });
      return data.data?.solana || [];
    } catch { return []; }
  }

  async function trackWallet(walletAddress, label = '') {
    try {
      const { data } = await axios.post(`${API}/api/analytics/watch`, { walletAddress, label });
      store.commit('analytics/ADD_WATCHED_WALLET', data);
      return data;
    } catch (e) { throw e; }
  }

  async function untrackWallet(walletAddress) {
    try {
      await axios.delete(`${API}/api/analytics/watch/${walletAddress}`);
      store.commit('analytics/REMOVE_WATCHED_WALLET', walletAddress);
    } catch (e) { throw e; }
  }

  async function loadWatchedWallets() {
    try {
      const { data } = await axios.get(`${API}/api/analytics/watch`);
      store.commit('analytics/SET_WATCHED_WALLETS', data);
      return data;
    } catch { return []; }
  }

  async function getWalletPnL(walletAddress) {
    loading.value = true;
    try {
      const { data } = await axios.get(`${API}/api/birdeye/wallet_portfolio`, {
        params: { wallet: walletAddress }
      });
      return data.data || null;
    } catch { return null; }
    finally { loading.value = false; }
  }

  return { loading, getTopWallets, getWalletTrades, trackWallet, untrackWallet, loadWatchedWallets, getWalletPnL };
}
