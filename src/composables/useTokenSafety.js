import axios from 'axios';

const HELIUS_PROXY = `${process.env.VUE_APP_API_BASE_URL}/api/helius`;
const RPC_URL = `${process.env.VUE_APP_API_BASE_URL}/api/helius`;

export function useTokenSafety() {
  async function rpc(method, params = []) {
    const { data } = await axios.post(RPC_URL, { jsonrpc: '2.0', id: 1, method, params });
    return data.result;
  }

  // Fetch Helius DAS asset info (mint authority, freeze authority, supply)
  async function getAssetInfo(mint) {
    try {
      const { data } = await axios.post(HELIUS_PROXY, {
        jsonrpc: '2.0', id: 1,
        method: 'getAsset',
        params: { id: mint },
      });
      return data.result || null;
    } catch { return null; }
  }

  // Get top holders via getTokenLargestAccounts
  async function getTopHolders(mint) {
    try {
      const result = await rpc('getTokenLargestAccounts', [mint]);
      const accounts = result?.value || [];
      // Get total supply for percentage
      const supplyResult = await rpc('getTokenSupply', [mint]);
      const totalSupply = supplyResult?.value?.uiAmount || 0;
      return accounts.slice(0, 10).map((a, i) => ({
        rank: i + 1,
        address: a.address,
        amount: a.uiAmount || 0,
        pct: totalSupply ? ((a.uiAmount / totalSupply) * 100).toFixed(2) : '0',
      }));
    } catch { return []; }
  }

  // Get mint info (mint authority + freeze authority)
  async function getMintInfo(mint) {
    try {
      const result = await rpc('getAccountInfo', [mint, { encoding: 'jsonParsed' }]);
      const info = result?.value?.data?.parsed?.info;
      if (!info) return null;
      return {
        mintAuthority: info.mintAuthority || null,
        freezeAuthority: info.freezeAuthority || null,
        supply: info.supply,
        decimals: info.decimals,
        isInitialized: info.isInitialized,
      };
    } catch { return null; }
  }

  // Compute a risk score (0=safe, 100=danger)
  function computeRiskScore({ mintAuthority, freezeAuthority, topHolders, lpLocked }) {
    let score = 0;
    if (mintAuthority) score += 30;         // can mint more tokens = high risk
    if (freezeAuthority) score += 20;       // can freeze wallets = medium risk
    if (!lpLocked) score += 20;             // LP not locked = rug risk
    // Top holder concentration
    const top1 = parseFloat(topHolders?.[0]?.pct || 0);
    const top5 = topHolders?.slice(0, 5).reduce((s, h) => s + parseFloat(h.pct || 0), 0);
    if (top1 > 20) score += 20;
    else if (top1 > 10) score += 10;
    if (top5 > 50) score += 10;
    return Math.min(score, 100);
  }

  function riskLabel(score) {
    if (score <= 20) return { label: 'SAFE', color: '#3fb950' };
    if (score <= 50) return { label: 'CAUTION', color: '#d29922' };
    return { label: 'DANGER', color: '#f85149' };
  }

  async function analyzeToken(mint) {
    const [mintInfo, topHolders] = await Promise.all([
      getMintInfo(mint),
      getTopHolders(mint),
    ]);

    const score = computeRiskScore({
      mintAuthority: mintInfo?.mintAuthority,
      freezeAuthority: mintInfo?.freezeAuthority,
      topHolders,
      lpLocked: false, // would need LP lock indexer; default assume unlocked
    });

    return {
      mint,
      mintAuthority: mintInfo?.mintAuthority,
      freezeAuthority: mintInfo?.freezeAuthority,
      decimals: mintInfo?.decimals,
      topHolders,
      riskScore: score,
      ...riskLabel(score),
    };
  }

  return { analyzeToken, getTopHolders, getMintInfo, riskLabel };
}
