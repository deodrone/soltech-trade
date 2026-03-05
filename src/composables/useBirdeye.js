import axios from 'axios';
import { ref } from 'vue';

// Birdeye calls are proxied through our backend to protect the API key
const PROXY = `${process.env.VUE_APP_API_BASE_URL}/api/birdeye`;

export function useBirdeye() {
  const loading = ref(false);

  async function getOHLCV({ address, type = '1H', timeFrom, timeTo }) {
    loading.value = true;
    try {
      const params = { address, type };
      if (timeFrom) params.time_from = timeFrom;
      if (timeTo) params.time_to = timeTo;
      const { data } = await axios.get(`${PROXY}/ohlcv`, { params });
      return data.data?.items || [];
    } catch { return []; }
    finally { loading.value = false; }
  }

  async function getTokenOverview(address) {
    try {
      const { data } = await axios.get(`${PROXY}/token_overview`, { params: { address } });
      return data.data || null;
    } catch { return null; }
  }

  async function getTopTraders(address) {
    try {
      const { data } = await axios.get(`${PROXY}/token_top_traders`, { params: { address, time_frame: '24h', sort_type: 'desc', sort_by: 'volume', limit: 20 } });
      return data.data?.items || [];
    } catch { return []; }
  }

  async function getTokenList({ sort_by = 'v24hUSD', sort_type = 'desc', offset = 0, limit = 50 } = {}) {
    try {
      const { data } = await axios.get(`${PROXY}/tokenlist`, { params: { sort_by, sort_type, offset, limit } });
      return data.data?.tokens || [];
    } catch { return []; }
  }

  async function getTrendingTokens(limit = 20) {
    try {
      const { data } = await axios.get(`${PROXY}/trending_tokens/solana`, { params: { limit } });
      return data.data?.tokens || [];
    } catch { return []; }
  }

  async function getWalletPortfolio(wallet) {
    try {
      const { data } = await axios.get(`${PROXY}/v1/wallet/token_list`, { params: { wallet } });
      return data.data || null;
    } catch { return null; }
  }

  function ohlcvToChartData(items) {
    return items.map(item => ({
      time: item.unixTime,
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      value: item.v,
    }));
  }

  return { loading, getOHLCV, getTokenOverview, getTopTraders, getTokenList, getTrendingTokens, getWalletPortfolio, ohlcvToChartData };
}
