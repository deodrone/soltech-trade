<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">Built on Solana · Powered by Jupiter Ultra</div>
        <h1 class="hero-title">
          The <span class="gradient-text">Fastest</span> Solana<br />Trading Terminal
        </h1>
        <p class="hero-sub">
          Swap, snipe, DCA, and launch tokens — with real-time charts,<br />
          smart money tracking, and one-click execution.
        </p>
        <div class="hero-ctas">
          <router-link to="/trade" class="cta-primary">Launch Terminal</router-link>
          <router-link to="/discover" class="cta-secondary">Explore Tokens</router-link>
        </div>
        <div class="hero-stats">
          <div class="hstat"><span class="hval">Jupiter Ultra</span><span class="hlbl">Best Routing</span></div>
          <div class="hsep" />
          <div class="hstat"><span class="hval">0 fees</span><span class="hlbl">to get started</span></div>
          <div class="hsep" />
          <div class="hstat"><span class="hval">Phantom / Solflare</span><span class="hlbl">Wallet Support</span></div>
          <div class="hsep" />
          <div class="hstat"><span class="hval">Real-time</span><span class="hlbl">Price Alerts</span></div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="features">
      <div class="features-grid">
        <div class="feat-card" @click="$router.push('/trade')">
          <div class="feat-icon">📊</div>
          <div class="feat-title">Trading Terminal</div>
          <div class="feat-desc">Professional candlestick charts, swap panel, limit orders, and order history — all in one view.</div>
          <div class="feat-link">Open Terminal →</div>
        </div>
        <div class="feat-card" @click="$router.push('/trade')">
          <div class="feat-icon">⚡</div>
          <div class="feat-title">Quick Buy</div>
          <div class="feat-desc">Buy tokens instantly with 0.1 / 0.5 / 1 / 5 SOL presets. No fumbling — one tap execution.</div>
          <div class="feat-link">Start Trading →</div>
        </div>
        <div class="feat-card premium" @click="$router.push('/trade')">
          <div class="feat-badge">Premium</div>
          <div class="feat-icon">🎯</div>
          <div class="feat-title">Sniper Feed</div>
          <div class="feat-desc">Live new token launches with auto-buy. Be first in every promising launch on Solana.</div>
          <div class="feat-link">Enable Sniper →</div>
        </div>
        <div class="feat-card premium" @click="$router.push('/trade')">
          <div class="feat-badge">Premium</div>
          <div class="feat-icon">🔄</div>
          <div class="feat-title">DCA Orders</div>
          <div class="feat-desc">Dollar-cost average into any Solana token automatically — set it and let it run via Jupiter DCA.</div>
          <div class="feat-link">Set Up DCA →</div>
        </div>
        <div class="feat-card premium" @click="$router.push('/trade')">
          <div class="feat-badge">Premium</div>
          <div class="feat-icon">🛡</div>
          <div class="feat-title">Stop Loss / Take Profit</div>
          <div class="feat-desc">Protect gains and cap losses automatically. Set price triggers and sleep easy.</div>
          <div class="feat-link">Protect Trades →</div>
        </div>
        <div class="feat-card" @click="$router.push('/discover')">
          <div class="feat-icon">🔥</div>
          <div class="feat-title">Token Discovery</div>
          <div class="feat-desc">Trending, new launches, gainers, and advanced filters. Find the next 100x before everyone else.</div>
          <div class="feat-link">Discover →</div>
        </div>
        <div class="feat-card" @click="$router.push('/portfolio')">
          <div class="feat-icon">👜</div>
          <div class="feat-title">Portfolio Tracker</div>
          <div class="feat-desc">Live USD value, token balances, allocation breakdown, and full transaction history.</div>
          <div class="feat-link">View Portfolio →</div>
        </div>
        <div class="feat-card" @click="$router.push('/launchpad')">
          <div class="feat-icon">🚀</div>
          <div class="feat-title">Token Launchpad</div>
          <div class="feat-desc">Launch your own Solana token in minutes — bonding curve, creator fees, vesting, and social links.</div>
          <div class="feat-link">Launch Token →</div>
        </div>
        <div class="feat-card" @click="$router.push('/analytics')">
          <div class="feat-icon">🐋</div>
          <div class="feat-title">Smart Money</div>
          <div class="feat-desc">Track whale wallets, copy top trader strategies, and monitor smart money flows in real time.</div>
          <div class="feat-link">Follow Whales →</div>
        </div>
      </div>
    </section>

    <!-- $SOLTECH Token Section -->
    <section class="soltech-section">
      <div class="soltech-inner">
        <div class="soltech-left">
          <div class="soltech-badge">🪙 Official Platform Token</div>
          <h2 class="soltech-title">$SOLTECH — Hold to Unlock Premium</h2>
          <p class="soltech-desc">
            Hold <strong>100,000 $SOLTECH</strong> tokens in your wallet and unlock all premium features forever —
            Sniper auto-buy, DCA orders, Stop Loss / Take Profit, unlimited copy trading, and advanced analytics.
          </p>
          <div class="soltech-mint">
            <span class="soltech-mint-label">Mint:</span>
            <code class="soltech-mint-addr">{{ SOLTECH_MINT.slice(0,18) }}...{{ SOLTECH_MINT.slice(-6) }}</code>
            <button class="copy-mint-btn" @click="copyMint" :title="SOLTECH_MINT">{{ mintCopied ? '✓' : '⎘' }}</button>
          </div>
          <div class="soltech-ctas">
            <a :href="`https://pump.fun/coin/${SOLTECH_MINT}`" target="_blank" class="cta-pump">Buy on Pump.fun ↗</a>
            <router-link :to="`/trade/${SOLTECH_MINT}`" class="cta-primary">Trade In-App ↗</router-link>
          </div>
        </div>
        <div class="soltech-right">
          <div class="soltech-perks">
            <div class="perk-row"><span class="pk">⚡</span><span>Sniper auto-buy</span></div>
            <div class="perk-row"><span class="pk">🔄</span><span>DCA recurring orders</span></div>
            <div class="perk-row"><span class="pk">🛡</span><span>Stop Loss / Take Profit</span></div>
            <div class="perk-row"><span class="pk">📋</span><span>Copy trade unlimited wallets</span></div>
            <div class="perk-row"><span class="pk">🐋</span><span>Smart money tracking</span></div>
            <div class="perk-row"><span class="pk">🔔</span><span>Unlimited price alerts</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Token Safety Banner -->
    <section class="safety-banner">
      <div class="safety-inner">
        <div class="safety-icon">🔒</div>
        <div>
          <div class="safety-title">Built-in Token Safety Scanner</div>
          <div class="safety-sub">Every token shows mint authority, freeze authority, top holder concentration, and a risk score — before you trade.</div>
        </div>
        <router-link to="/discover" class="cta-secondary" style="white-space:nowrap">Try It Free</router-link>
      </div>
    </section>

    <!-- Premium CTA -->
    <section class="premium-cta">
      <div class="prem-inner">
        <div class="prem-left">
          <div class="prem-badge">👑 Soltech Premium</div>
          <h2>Unlock the Full Terminal</h2>
          <p>Hold <strong>100K $SOLTECH</strong> tokens or subscribe for <strong>0.05 SOL/month</strong> to access DCA orders, Stop Loss / Take Profit, and the Sniper auto-buy feed.</p>
          <div class="prem-perks">
            <span>✅ DCA recurring orders</span>
            <span>✅ Stop Loss / Take Profit</span>
            <span>✅ Sniper auto-buy</span>
            <span>✅ Priority support</span>
          </div>
        </div>
        <div class="prem-right">
          <router-link to="/trade" class="cta-primary" style="font-size:1rem;padding:14px 36px">Unlock Premium</router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="home-footer">
      <div class="footer-links">
        <router-link to="/trade">Terminal</router-link>
        <router-link to="/discover">Discover</router-link>
        <router-link to="/portfolio">Portfolio</router-link>
        <router-link to="/launchpad">Launchpad</router-link>
        <router-link to="/alerts">Alerts</router-link>
      </div>
      <div class="footer-copy">© 2026 Soltech Trade · Built on Solana</div>
    </footer>
  </div>
</template>

<script>
import { ref } from 'vue';

const SOLTECH_MINT = process.env.VUE_APP_SOLTECH_TOKEN_MINT || 'ZsVAw9KE4mJCNJhKPBKChqCPRHxF8F89kwxZ6zqpump';

export default {
  name: 'HomeView',
  setup() {
    const mintCopied = ref(false);
    function copyMint() {
      navigator.clipboard.writeText(SOLTECH_MINT);
      mintCopied.value = true;
      setTimeout(() => { mintCopied.value = false; }, 1500);
    }
    return { SOLTECH_MINT, mintCopied, copyMint };
  }
};
</script>

<style scoped>
.home { background: #0d1117; min-height: 100vh; }

/* Hero */
.hero { display: flex; justify-content: center; padding: 80px 24px 60px; }
.hero-inner { max-width: 760px; text-align: center; }
.hero-badge { display: inline-block; padding: 5px 14px; background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.25); border-radius: 20px; font-size: 0.78rem; color: #58a6ff; margin-bottom: 24px; letter-spacing: 0.02em; }
.hero-title { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; color: #e6edf3; line-height: 1.15; margin: 0 0 20px; letter-spacing: -0.02em; }
.gradient-text { background: linear-gradient(135deg, #58a6ff 0%, #3fb950 50%, #d2a8ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-sub { font-size: 1.05rem; color: #8b949e; line-height: 1.6; margin: 0 0 32px; }
.hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px; }
.cta-primary { padding: 12px 28px; background: linear-gradient(135deg, #1f6feb, #388bfd); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.95rem; transition: opacity 0.15s; }
.cta-primary:hover { opacity: 0.88; }
.cta-secondary { padding: 12px 28px; background: transparent; border: 1px solid #30363d; color: #e6edf3; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; transition: border-color 0.15s; }
.cta-secondary:hover { border-color: #58a6ff; color: #58a6ff; }
.hero-stats { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
.hstat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.hval { font-size: 0.88rem; font-weight: 700; color: #e6edf3; }
.hlbl { font-size: 0.7rem; color: #8b949e; }
.hsep { width: 1px; height: 32px; background: #30363d; }

/* Features */
.features { padding: 0 24px 60px; max-width: 1200px; margin: 0 auto; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.feat-card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 24px; cursor: pointer; transition: border-color 0.15s, transform 0.15s; position: relative; overflow: hidden; }
.feat-card:hover { border-color: #58a6ff; transform: translateY(-2px); }
.feat-card.premium { border-color: rgba(139,87,229,0.3); }
.feat-card.premium:hover { border-color: #8957e5; }
.feat-badge { position: absolute; top: 12px; right: 12px; padding: 2px 8px; background: linear-gradient(135deg, #1f6feb, #8957e5); color: #fff; border-radius: 10px; font-size: 0.65rem; font-weight: 700; }
.feat-icon { font-size: 1.8rem; margin-bottom: 12px; }
.feat-title { font-size: 0.95rem; font-weight: 700; color: #e6edf3; margin-bottom: 8px; }
.feat-desc { font-size: 0.8rem; color: #8b949e; line-height: 1.5; margin-bottom: 16px; }
.feat-link { font-size: 0.78rem; color: #58a6ff; font-weight: 600; }

/* Safety banner */
.safety-banner { margin: 0 24px 40px; max-width: 1152px; margin-left: auto; margin-right: auto; }
.safety-inner { display: flex; align-items: center; gap: 20px; padding: 24px 28px; background: rgba(63,185,80,0.06); border: 1px solid rgba(63,185,80,0.25); border-radius: 12px; flex-wrap: wrap; }
.safety-icon { font-size: 2rem; flex-shrink: 0; }
.safety-title { font-weight: 700; color: #e6edf3; margin-bottom: 4px; }
.safety-sub { font-size: 0.82rem; color: #8b949e; }

/* Premium CTA */
.premium-cta { margin: 0 24px 60px; max-width: 1152px; margin-left: auto; margin-right: auto; }
.prem-inner { display: flex; align-items: center; justify-content: space-between; gap: 32px; padding: 36px 40px; background: linear-gradient(135deg, rgba(31,111,235,0.1) 0%, rgba(137,87,229,0.1) 100%); border: 1px solid rgba(137,87,229,0.3); border-radius: 16px; flex-wrap: wrap; }
.prem-left { flex: 1; }
.prem-badge { display: inline-block; padding: 4px 12px; background: rgba(139,87,229,0.2); border: 1px solid rgba(139,87,229,0.4); border-radius: 20px; font-size: 0.78rem; color: #d2a8ff; margin-bottom: 12px; }
.prem-left h2 { font-size: 1.4rem; font-weight: 800; color: #e6edf3; margin: 0 0 10px; }
.prem-left p { font-size: 0.88rem; color: #8b949e; line-height: 1.6; margin: 0 0 16px; }
.prem-perks { display: flex; flex-wrap: wrap; gap: 10px 20px; font-size: 0.82rem; color: #3fb950; }

/* $SOLTECH Section */
.soltech-section { margin: 0 24px 40px; max-width: 1152px; margin-left: auto; margin-right: auto; }
.soltech-inner { display: flex; gap: 40px; padding: 36px 40px; background: linear-gradient(135deg, rgba(240,165,0,0.06) 0%, rgba(88,166,255,0.06) 100%); border: 1px solid rgba(240,165,0,0.3); border-radius: 16px; flex-wrap: wrap; align-items: center; }
.soltech-left { flex: 1; min-width: 280px; }
.soltech-badge { display: inline-block; padding: 4px 12px; background: rgba(240,165,0,0.15); border: 1px solid rgba(240,165,0,0.4); border-radius: 20px; font-size: 0.78rem; color: #f0a500; margin-bottom: 12px; }
.soltech-title { font-size: 1.3rem; font-weight: 800; color: #e6edf3; margin: 0 0 10px; }
.soltech-desc { font-size: 0.85rem; color: #8b949e; line-height: 1.6; margin: 0 0 14px; }
.soltech-mint { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.soltech-mint-label { font-size: 0.72rem; color: #8b949e; }
.soltech-mint-addr { font-family: monospace; font-size: 0.72rem; color: #58a6ff; background: rgba(88,166,255,0.08); padding: 2px 8px; border-radius: 4px; word-break: break-all; }
.copy-mint-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 2px 6px; cursor: pointer; font-size: 0.8rem; }
.copy-mint-btn:hover { border-color: #58a6ff; color: #58a6ff; }
.soltech-ctas { display: flex; gap: 10px; flex-wrap: wrap; }
.cta-pump { padding: 10px 20px; background: rgba(240,165,0,0.12); border: 1px solid rgba(240,165,0,0.4); color: #f0a500; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.88rem; }
.cta-pump:hover { background: rgba(240,165,0,0.22); }
.soltech-right { display: flex; align-items: center; }
.soltech-perks { display: flex; flex-direction: column; gap: 8px; }
.perk-row { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #e6edf3; }
.pk { font-size: 1rem; width: 20px; }

/* Footer */
.home-footer { border-top: 1px solid #21262d; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.footer-links { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
.footer-links a { color: #8b949e; text-decoration: none; font-size: 0.85rem; }
.footer-links a:hover { color: #e6edf3; }
.footer-copy { font-size: 0.75rem; color: #484f58; }
</style>
