import { ref } from 'vue';
import axios from 'axios';

const JUPITER_API    = 'https://quote-api.jup.ag/v6';
const JUPITER_ULTRA  = 'https://lite-api.jup.ag/ultra/v1';
const JUPITER_PRICE  = 'https://lite-api.jup.ag/price/v3';
const JUPITER_TOKENS = 'https://tokens.jup.ag/tokens?tags=verified';

// Jupiter Ultra referral fee — min 50 bps, max 255 bps (Jupiter keeps 20%)
// Register at https://referral.jup.ag or run scripts/setup-referral.js
const REFERRAL_ACCOUNT = process.env.VUE_APP_REFERRAL_ACCOUNT || null;
const REFERRAL_FEE_BPS = parseInt(process.env.VUE_APP_PLATFORM_FEE_BPS || '50');
const JUPITER_API_KEY  = process.env.VUE_APP_JUPITER_API_KEY  || '';

// Legacy v6 fee (fallback for DCA / limit orders)
const PLATFORM_FEE_ACCOUNT = process.env.VUE_APP_PLATFORM_FEE_ACCOUNT || REFERRAL_ACCOUNT;

const tokenListCache = ref([]);

export function useJupiter() {
  const loading = ref(false);
  const error = ref(null);

  async function getTokenList() {
    if (tokenListCache.value.length) return tokenListCache.value;
    const { data } = await axios.get(JUPITER_TOKENS);
    tokenListCache.value = data;
    return data;
  }

  async function getQuote({ inputMint, outputMint, amount, slippageBps = 100 }) {
    loading.value = true; error.value = null;
    try {
      const params = { inputMint, outputMint, amount, slippageBps, onlyDirectRoutes: false, asLegacyTransaction: false };
      // Attach platform fee if configured
      if (PLATFORM_FEE_ACCOUNT) {
        params.platformFeeBps = REFERRAL_FEE_BPS;
      }
      const { data } = await axios.get(`${JUPITER_API}/quote`, { params });
      return data;
    } catch (e) { error.value = e.message; return null; }
    finally { loading.value = false; }
  }

  async function getSwapTransaction({ quoteResponse, userPublicKey, useJito = true, prioritizationFeeLamports = 'auto' }) {
    loading.value = true; error.value = null;
    try {
      const body = {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports,
      };
      if (useJito) body.jitoTipLamports = 1000;
      if (PLATFORM_FEE_ACCOUNT) body.feeAccount = PLATFORM_FEE_ACCOUNT;
      const { data } = await axios.post(`${JUPITER_API}/swap`, body);
      return data.swapTransaction;
    } catch (e) { error.value = e.message; return null; }
    finally { loading.value = false; }
  }

  // ── Jupiter Ultra Swap (with integrator referral fees) ──────────────────────
  async function ultraOrder({ inputMint, outputMint, amount, taker }) {
    loading.value = true; error.value = null;
    try {
      const params = new URLSearchParams({ inputMint, outputMint, amount, taker });
      if (REFERRAL_ACCOUNT) {
        params.set('referralAccount', REFERRAL_ACCOUNT);
        params.set('referralFee', REFERRAL_FEE_BPS);
      }
      const headers = JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : {};
      const res = await fetch(`${JUPITER_ULTRA}/order?${params}`, { headers });
      if (!res.ok) throw new Error(`Ultra order failed: ${res.status}`);
      return await res.json(); // { transaction, requestId, feeMint, feeBps, inAmount, outAmount, ... }
    } catch (e) { error.value = e.message; return null; }
    finally { loading.value = false; }
  }

  async function ultraExecute({ signedTransaction, requestId }) {
    loading.value = true; error.value = null;
    try {
      const headers = { 'Content-Type': 'application/json', ...(JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : {}) };
      const res = await fetch(`${JUPITER_ULTRA}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ signedTransaction, requestId }),
      });
      if (!res.ok) throw new Error(`Ultra execute failed: ${res.status}`);
      return await res.json(); // { status, signature, ... }
    } catch (e) { error.value = e.message; return null; }
    finally { loading.value = false; }
  }

  async function getPrice(mints) {
    const ids = Array.isArray(mints) ? mints.join(',') : mints;
    try {
      const { data } = await axios.get(`${JUPITER_PRICE}?ids=${ids}`);
      return data || {};
    } catch { return {}; }
  }

  async function getLimitOrders(wallet) {
    try {
      const { data } = await axios.get(`${JUPITER_API}/limit/v2/openOrders`, { params: { wallet } });
      return data.orders || [];
    } catch { return []; }
  }

  async function createLimitOrder({ inputMint, outputMint, inAmount, outAmount, expiredAt, wallet }) {
    // Returns instruction data for limit order — to be signed by wallet
    const { data } = await axios.post(`${JUPITER_API}/limit/v2/createOrder`, {
      inputMint, outputMint, inAmount, outAmount, expiredAt,
      maker: wallet, payer: wallet
    });
    return data;
  }

  function lamportsToUi(lamports, decimals) {
    return lamports / Math.pow(10, decimals);
  }

  function uiToLamports(amount, decimals) {
    return Math.round(parseFloat(amount) * Math.pow(10, decimals));
  }

  return { loading, error, getTokenList, getQuote, getSwapTransaction, ultraOrder, ultraExecute, getPrice, getLimitOrders, createLimitOrder, lamportsToUi, uiToLamports };
}
