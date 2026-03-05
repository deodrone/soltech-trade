import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

// Use backend proxy to avoid exposing Helius API key in browser bundle
const SOLANA_RPC = `${process.env.VUE_APP_API_BASE_URL}/api/helius`;

let connection = null;
export function getSolanaConnection() {
  if (!connection) connection = new Connection(SOLANA_RPC, 'confirmed');
  return connection;
}

// Wallet adapter state (shared singleton)
const adapterWallet = ref(null);

export function useSolanaWallet() {
  const store = useStore();

  const connected = computed(() => store.getters['wallet/isConnected']);
  const publicKey = computed(() => store.getters['wallet/publicKey']);
  const shortKey = computed(() => store.getters['wallet/shortKey']);
  const balanceSol = computed(() => store.getters['wallet/balanceSol']);

  async function connectWallet(walletName = 'Phantom') {
    store.commit('wallet/SET_CONNECTING', true);
    try {
      let provider;
      if (walletName === 'Phantom' && window.phantom?.solana) {
        provider = window.phantom.solana;
      } else if (walletName === 'Solflare' && window.solflare) {
        provider = window.solflare;
      } else if (walletName === 'Backpack' && window.backpack) {
        provider = window.backpack;
      } else {
        // fallback: try generic window.solana
        provider = window.solana;
      }

      if (!provider) throw new Error(`${walletName} wallet not found. Please install the extension.`);

      const resp = await provider.connect();
      const pk = resp.publicKey.toString();
      adapterWallet.value = provider;

      store.commit('wallet/SET_CONNECTED', { publicKey: pk, walletName });
      await refreshBalance(pk);
      return pk;
    } catch (e) {
      store.commit('wallet/SET_CONNECTING', false);
      throw e;
    }
  }

  async function disconnectWallet() {
    if (adapterWallet.value?.disconnect) await adapterWallet.value.disconnect();
    adapterWallet.value = null;
    store.commit('wallet/SET_DISCONNECTED');
  }

  async function refreshBalance(pk) {
    try {
      const conn = getSolanaConnection();
      const lamports = await conn.getBalance(new PublicKey(pk));
      store.commit('wallet/SET_BALANCE', lamports / 1e9);
    } catch { /* ignore */ }
  }

  async function signAndSendTransaction(swapTransactionBase64) {
    if (!adapterWallet.value) throw new Error('Wallet not connected');
    const conn = getSolanaConnection();
    const swapTransactionBuf = Buffer.from(swapTransactionBase64, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    const signed = await adapterWallet.value.signTransaction(transaction);
    const txid = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: true, maxRetries: 3 });
    await conn.confirmTransaction(txid, 'confirmed');
    return txid;
  }

  // Sign only — returns signed transaction as base64 (used for Jupiter Ultra execute flow)
  async function signTransactionBase64(transactionBase64) {
    if (!adapterWallet.value) throw new Error('Wallet not connected');
    const buf = Buffer.from(transactionBase64, 'base64');
    const transaction = VersionedTransaction.deserialize(buf);
    const signed = await adapterWallet.value.signTransaction(transaction);
    return Buffer.from(signed.serialize()).toString('base64');
  }

  function getAvailableWallets() {
    const wallets = [];
    if (window.phantom?.solana) wallets.push({ name: 'Phantom', icon: 'https://phantom.app/img/phantom-logo.svg' });
    if (window.solflare) wallets.push({ name: 'Solflare', icon: 'https://solflare.com/logo.png' });
    if (window.backpack) wallets.push({ name: 'Backpack', icon: 'https://backpack.app/logo.png' });
    if (!wallets.length) wallets.push({ name: 'Phantom', icon: 'https://phantom.app/img/phantom-logo.svg', installUrl: 'https://phantom.app' });
    return wallets;
  }

  return { connected, publicKey, shortKey, balanceSol, connectWallet, disconnectWallet, refreshBalance, signAndSendTransaction, signTransactionBase64, getAvailableWallets };
}
