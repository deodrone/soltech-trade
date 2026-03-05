import axios from 'axios';

const PROXY = `${process.env.VUE_APP_API_BASE_URL}/api/helius`;

export function useHelius() {
  async function rpc(method, params = []) {
    const { data } = await axios.post(PROXY, { jsonrpc: '2.0', id: 1, method, params });
    return data.result;
  }

  async function getTokenAccounts(walletAddress) {
    try {
      const { data } = await axios.post(PROXY, {
        jsonrpc: '2.0', id: 1,
        method: 'getTokenAccountsByOwner',
        params: [walletAddress, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' }]
      });
      return data.result?.value || [];
    } catch { return []; }
  }

  async function getAssetsByOwner(walletAddress, page = 1, limit = 100) {
    try {
      const { data } = await axios.post(PROXY, {
        jsonrpc: '2.0', id: 1,
        method: 'getAssetsByOwner',
        params: { ownerAddress: walletAddress, page, limit, displayOptions: { showFungible: true, showNativeBalance: true } }
      });
      return data.result || { items: [], nativeBalance: {} };
    } catch { return { items: [], nativeBalance: {} }; }
  }

  async function getTxHistory(walletAddress, limit = 50, before = null) {
    try {
      const params = { address: walletAddress, limit };
      if (before) params.before = before;
      const { data } = await axios.post(PROXY, {
        jsonrpc: '2.0', id: 1,
        method: 'getSignaturesForAddress',
        params: [walletAddress, { limit, before: before || undefined }]
      });
      return data.result || [];
    } catch { return []; }
  }

  async function getParsedTransactions(signatures) {
    try {
      const { data } = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/api/helius/parsed-transactions`, { signatures });
      return data || [];
    } catch { return []; }
  }

  async function getBalance(walletAddress) {
    try {
      const result = await rpc('getBalance', [walletAddress]);
      return (result?.value || 0) / 1e9;
    } catch { return 0; }
  }

  return { getTokenAccounts, getAssetsByOwner, getTxHistory, getParsedTransactions, getBalance, rpc };
}
