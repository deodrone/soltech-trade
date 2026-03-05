/**
 * One-time script to register your Jupiter Ultra Referral Account and
 * token accounts for SOL + USDC fee collection.
 *
 * Run once:
 *   node scripts/setup-referral.js
 *
 * Prerequisites:
 *   npm install @jup-ag/referral-sdk @solana/web3.js@1 bs58 dotenv
 *   Set REFERRAL_PRIVATE_KEY in .env.local (base58 private key from Phantom export)
 *
 * After running, copy the printed referralAccountPubkey into:
 *   VUE_APP_REFERRAL_ACCOUNT=<printed pubkey>  (frontend .env)
 */

require('dotenv').config({ path: '.env.local' });
const { ReferralProvider } = require('@jup-ag/referral-sdk');
const { Connection, Keypair, PublicKey, sendAndConfirmTransaction, sendAndConfirmRawTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');

const RPC_URL    = process.env.VUE_APP_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
const PRIVATE_KEY = process.env.REFERRAL_PRIVATE_KEY;
if (!PRIVATE_KEY) { console.error('Set REFERRAL_PRIVATE_KEY in .env.local'); process.exit(1); }

const connection = new Connection(RPC_URL, 'confirmed');
const wallet     = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
const provider   = new ReferralProvider(connection);

// Jupiter Ultra Referral Project pubkey (fixed — do not change)
const PROJECT_PUBKEY = new PublicKey('DkiqsTrw1u1bYFumumC7sCG2S8K25qc2vemJFHyW2wJc');

const SOL_MINT  = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function main() {
  console.log('Wallet:', wallet.publicKey.toBase58());

  // 1. Create referral account (only needed once)
  const ref = await provider.initializeReferralAccountWithName({
    payerPubKey:   wallet.publicKey,
    partnerPubKey: wallet.publicKey,
    projectPubKey: PROJECT_PUBKEY,
    name: 'Soltech Trade',
  });

  const existing = await connection.getAccountInfo(ref.referralAccountPubKey);
  if (!existing) {
    const sig = await sendAndConfirmTransaction(connection, ref.tx, [wallet]);
    console.log('Referral account created:', ref.referralAccountPubKey.toBase58());
    console.log('TX:', `https://solscan.io/tx/${sig}`);
  } else {
    console.log('Referral account already exists:', ref.referralAccountPubKey.toBase58());
  }

  const referralAccountPubKey = ref.referralAccountPubKey;
  console.log('\n>>> Set in frontend .env:\nVUE_APP_REFERRAL_ACCOUNT=' + referralAccountPubKey.toBase58());

  // 2. Create token accounts for SOL and USDC fee collection
  for (const mintStr of [SOL_MINT, USDC_MINT]) {
    const mint = new PublicKey(mintStr);
    const tokenTx = await provider.initializeReferralTokenAccountV2({
      payerPubKey: wallet.publicKey,
      referralAccountPubKey,
      mint,
    });
    const tokenAcct = await connection.getAccountInfo(tokenTx.tokenAccount);
    if (!tokenAcct) {
      const sig = await sendAndConfirmTransaction(connection, tokenTx.tx, [wallet]);
      console.log(`\nToken account created for ${mintStr}:`, tokenTx.tokenAccount.toBase58());
      console.log('TX:', `https://solscan.io/tx/${sig}`);
    } else {
      console.log(`\nToken account for ${mintStr} already exists:`, tokenTx.tokenAccount.toBase58());
    }
  }

  console.log('\nSetup complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
