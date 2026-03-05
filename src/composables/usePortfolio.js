import { ref } from 'vue';
import { useStore } from 'vuex';
import { useHelius } from './useHelius';
import { useJupiter } from './useJupiter';

export function usePortfolio() {
  const store = useStore();
  const { getAssetsByOwner } = useHelius();
  const { getPrice } = useJupiter();
  const loading = ref(false);
  const portfolio = ref({ tokens: [], totalUsd: 0, solBalance: 0 });

  async function loadPortfolio(walletAddress) {
    if (!walletAddress) return;
    loading.value = true;
    try {
      const result = await getAssetsByOwner(walletAddress);
      const solBalance = (result.nativeBalance?.lamports || 0) / 1e9;

      const fungibles = (result.items || []).filter(
        a => a.interface === 'FungibleToken' || a.interface === 'FungibleAsset'
      );

      const mints = fungibles.map(a => a.id);
      const prices = mints.length ? await getPrice(mints) : {};

      const tokens = fungibles.map(a => {
        const amount = a.token_info?.balance / Math.pow(10, a.token_info?.decimals || 0) || 0;
        const price = prices[a.id]?.price || 0;
        return {
          mint: a.id,
          symbol: a.token_info?.symbol || a.content?.metadata?.symbol || '???',
          name: a.content?.metadata?.name || a.token_info?.symbol || 'Unknown',
          logo: a.content?.links?.image || null,
          amount,
          price,
          value: amount * price,
          decimals: a.token_info?.decimals || 0,
        };
      }).filter(t => t.value > 0.01 || t.amount > 0).sort((a, b) => b.value - a.value);

      // Add SOL
      const solPrice = prices['So11111111111111111111111111111111111111112']?.price || 0;
      if (solBalance > 0) {
        tokens.unshift({
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          amount: solBalance,
          price: solPrice,
          value: solBalance * solPrice,
          decimals: 9,
        });
      }

      const totalUsd = tokens.reduce((sum, t) => sum + t.value, 0);
      portfolio.value = { tokens, totalUsd, solBalance };
      store.commit('wallet/SET_TOKENS', tokens);
      store.commit('wallet/SET_BALANCE', solBalance);
    } catch (e) {
      console.error('Portfolio load error:', e);
    } finally {
      loading.value = false;
    }
  }

  function formatUsd(val) {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  }

  return { loading, portfolio, loadPortfolio, formatUsd };
}
