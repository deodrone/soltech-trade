import axios from 'axios';
import { ref } from 'vue';

const PUMP_API = 'https://frontend-api.pump.fun';

export function usePumpFun() {
  const loading = ref(false);

  async function getNewTokens({ limit = 50, offset = 0, sort = 'created_timestamp', order = 'DESC' } = {}) {
    loading.value = true;
    try {
      const { data } = await axios.get(`${PUMP_API}/coins`, {
        params: { limit, offset, sort, order, includeNsfw: false }
      });
      return data || [];
    } catch { return []; }
    finally { loading.value = false; }
  }

  async function getTrendingTokens(limit = 20) {
    loading.value = true;
    try {
      const { data } = await axios.get(`${PUMP_API}/coins`, {
        params: { limit, offset: 0, sort: 'last_trade_timestamp', order: 'DESC', includeNsfw: false }
      });
      return data || [];
    } catch { return []; }
    finally { loading.value = false; }
  }

  async function getTokenInfo(mint) {
    try {
      const { data } = await axios.get(`${PUMP_API}/coins/${mint}`);
      return data || null;
    } catch { return null; }
  }

  async function getBondingCurve(mint) {
    try {
      const { data } = await axios.get(`${PUMP_API}/coins/${mint}`);
      if (!data) return null;
      const progress = (data.virtual_sol_reserves / 79_000_000_000) * 100;
      return {
        mint,
        progress: Math.min(progress, 100),
        virtualSolReserves: data.virtual_sol_reserves,
        virtualTokenReserves: data.virtual_token_reserves,
        complete: data.complete || false,
        king_of_the_hill: data.king_of_the_hill_timestamp,
      };
    } catch { return null; }
  }

  function formatToken(token) {
    return {
      mint: token.mint,
      name: token.name,
      symbol: token.symbol,
      image: token.image_uri,
      description: token.description,
      createdAt: token.created_timestamp,
      marketCap: token.market_cap,
      usdMarketCap: token.usd_market_cap,
      replies: token.reply_count,
      progress: Math.min((token.virtual_sol_reserves / 79_000_000_000) * 100, 100),
      complete: token.complete,
      website: token.website,
      twitter: token.twitter,
      telegram: token.telegram,
      creator: token.creator,
    };
  }

  return { loading, getNewTokens, getTrendingTokens, getTokenInfo, getBondingCurve, formatToken };
}
