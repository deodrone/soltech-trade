import { ref, computed } from 'vue';
import axios from 'axios';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSolanaConnection } from './useSolanaWallet';
import { auth } from '../config/firebase';

// ── Config ───────────────────────────────────────────────────────────────────
// Set these in .env / AWS EB environment variables
const PLATFORM_WALLET    = process.env.VUE_APP_PLATFORM_WALLET || '';          // Your Phantom wallet address
const SOLTECH_MINT       = process.env.VUE_APP_SOLTECH_TOKEN_MINT || '';        // $SOLTECH token mint (set after launch)
const PREMIUM_TOKEN_THRESHOLD = 100_000;  // hold 100K $SOLTECH = premium
const SUBSCRIPTION_PRICE_SOL  = 0.05;     // 0.05 SOL / month subscription
const SUBSCRIPTION_DAYS       = 30;
const API = process.env.VUE_APP_API_BASE_URL;

// Shared state
const premiumStatus = ref({ active: false, method: null, expiresAt: null });
const checking = ref(false);

export function usePremium() {

  // ── Check $SOLTECH token balance ──────────────────────────────────────────
  async function checkTokenBalance(walletAddress) {
    if (!SOLTECH_MINT || !walletAddress) return 0;
    try {
      const conn = getSolanaConnection();
      const walletPk = new PublicKey(walletAddress);
      const mintPk   = new PublicKey(SOLTECH_MINT);
      const accounts = await conn.getParsedTokenAccountsByOwner(walletPk, { mint: mintPk });
      const balance  = accounts.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
      return balance;
    } catch { return 0; }
  }

  // ── Check subscription in DB ──────────────────────────────────────────────
  async function checkSubscription(walletAddress) {
    if (!walletAddress) return null;
    try {
      const { data } = await axios.get(`${API}/api/premium/status?wallet=${walletAddress}`);
      return data; // { active, expiresAt }
    } catch { return null; }
  }

  // ── Full premium check ────────────────────────────────────────────────────
  async function checkPremium(walletAddress) {
    if (!walletAddress) { premiumStatus.value = { active: false }; return; }
    checking.value = true;
    try {
      const [tokenBal, sub] = await Promise.all([
        checkTokenBalance(walletAddress),
        checkSubscription(walletAddress),
      ]);

      if (tokenBal >= PREMIUM_TOKEN_THRESHOLD) {
        premiumStatus.value = { active: true, method: 'token', balance: tokenBal };
      } else if (sub?.active) {
        premiumStatus.value = { active: true, method: 'subscription', expiresAt: sub.expiresAt };
      } else {
        premiumStatus.value = { active: false, tokenBalance: tokenBal };
      }
    } finally { checking.value = false; }
  }

  // ── Pay for subscription (send SOL to platform wallet) ───────────────────
  async function paySubscription(walletAddress, walletProvider) {
    if (!PLATFORM_WALLET) throw new Error('Platform wallet not configured');
    const conn = getSolanaConnection();
    const lamports = Math.round(SUBSCRIPTION_PRICE_SOL * LAMPORTS_PER_SOL);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress),
        toPubkey:   new PublicKey(PLATFORM_WALLET),
        lamports,
      })
    );
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    tx.feePayer = new PublicKey(walletAddress);

    const signed = await walletProvider.signTransaction(tx);
    const txid   = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: true });
    await conn.confirmTransaction(txid, 'confirmed');
    return txid;
  }

  // ── Register subscription with backend (after paying) ────────────────────
  async function registerSubscription(walletAddress, txid) {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await axios.post(`${API}/api/premium/subscribe`, { wallet: walletAddress, txid }, { headers });
    return data;
  }

  const isPremium   = computed(() => premiumStatus.value.active);
  const premiumMethod = computed(() => premiumStatus.value.method);

  return {
    premiumStatus, checking, isPremium, premiumMethod,
    checkPremium, paySubscription, registerSubscription,
    SUBSCRIPTION_PRICE_SOL, PREMIUM_TOKEN_THRESHOLD, SOLTECH_MINT,
  };
}
