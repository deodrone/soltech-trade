import axios from 'axios';
import { ref } from 'vue';

const BASE = 'https://api.dexscreener.com';

export function useDexScreener() {
  const loading = ref(false);

  async function getTrending() {
    loading.value = true;
    try {
      const { data } = await axios.get(`${BASE}/token-boosts/top/v1`);
      return (data || []).filter(t => t.chainId === 'solana');
    } catch { return []; }
    finally { loading.value = false; }
  }

  async function getLatestBoosted() {
    try {
      const { data } = await axios.get(`${BASE}/token-boosts/latest/v1`);
      return (data || []).filter(t => t.chainId === 'solana');
    } catch { return []; }
  }

  async function getPairData(pairAddress) {
    try {
      const { data } = await axios.get(`${BASE}/latest/dex/pairs/solana/${pairAddress}`);
      return data.pair || null;
    } catch { return null; }
  }

  async function searchTokens(query) {
    try {
      const { data } = await axios.get(`${BASE}/latest/dex/search?q=${encodeURIComponent(query)}`);
      return (data.pairs || []).filter(p => p.chainId === 'solana');
    } catch { return []; }
  }

  async function getTokenPairs(mintAddress) {
    try {
      const { data } = await axios.get(`${BASE}/tokens/solana/${mintAddress}`);
      return data.pairs || [];
    } catch { return []; }
  }

  async function getNewPairs() {
    // Use search for new Solana pairs sorted by age
    try {
      const { data } = await axios.get(`${BASE}/latest/dex/search?q=solana`);
      const pairs = (data.pairs || [])
        .filter(p => p.chainId === 'solana')
        .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
      return pairs.slice(0, 50);
    } catch { return []; }
  }

  function formatPair(pair) {
    return {
      address: pair.pairAddress,
      baseToken: pair.baseToken,
      quoteToken: pair.quoteToken,
      price: parseFloat(pair.priceUsd || 0),
      priceNative: parseFloat(pair.priceNative || 0),
      change5m: pair.priceChange?.m5 || 0,
      change1h: pair.priceChange?.h1 || 0,
      change24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || 0,
      liquidity: pair.liquidity?.usd || 0,
      marketCap: pair.marketCap || 0,
      fdv: pair.fdv || 0,
      txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
      buys24h: pair.txns?.h24?.buys || 0,
      sells24h: pair.txns?.h24?.sells || 0,
      createdAt: pair.pairCreatedAt,
      dexId: pair.dexId,
      url: pair.url,
      logo: pair.info?.imageUrl || null,
    };
  }

  return { loading, getTrending, getLatestBoosted, getPairData, searchTokens, getTokenPairs, getNewPairs, formatPair };
}
