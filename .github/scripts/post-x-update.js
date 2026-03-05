const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

const deployMessages = [
  `🚀 Soltech Trade just shipped a new update!\n\nThe fastest Solana DEX terminal — swap, snipe, DCA, and launch tokens in seconds.\n\n🔥 Try it free: https://soltechtrade.netlify.app\n#Solana #DeFi #Crypto`,
  `⚡ New features live on Soltech Trade!\n\n✅ Real-time charts\n✅ Sniper feed\n✅ DCA orders\n✅ Stop Loss / Take Profit\n✅ Token safety scanner\n\nTrade smarter on Solana 👉 https://soltechtrade.netlify.app\n#Solana #Trading`,
  `🛠 Soltech Trade update deployed!\n\nBuilding the best Solana trading terminal — powered by Jupiter, Helius, and DexScreener.\n\nJoin the community: https://soltechtrade.netlify.app\n#Solana #Web3 #DeFi`,
];

const weeklyMessages = [
  `📊 Weekly update from Soltech Trade!\n\nWe're building the most powerful Solana DEX terminal — completely free to use.\n\n🎯 Features:\n• One-click swap via Jupiter Ultra\n• Live sniper feed\n• DCA & Stop Loss orders\n• Token launch pad\n\nhttps://soltechtrade.netlify.app\n#Solana #Crypto #DeFi`,
  `🔥 Why Soltech Trade?\n\n• 0 download required — trade in your browser\n• Jupiter Ultra routing = best prices\n• Built-in token safety scanner\n• Premium features for $SOLTECH holders\n\nTry it now 👉 https://soltechtrade.netlify.app\n#Solana #Trading #DeFi`,
  `💡 Did you know?\n\nSoltech Trade earns you 0.4% on every swap as an integrator fee — all going back to the platform.\n\nHold $SOLTECH tokens for premium access free:\n• DCA orders\n• Stop Loss / Take Profit\n• Sniper auto-buy\n\nhttps://soltechtrade.netlify.app\n#Solana #Memecoin`,
];

async function run() {
  const rwClient = client.readWrite;

  let text;

  if (process.env.CUSTOM_MESSAGE) {
    text = process.env.CUSTOM_MESSAGE;
  } else if (process.env.COMMIT_MSG && !process.env.COMMIT_MSG.includes('Merge')) {
    // Triggered by a push — post a deploy update
    const msg = deployMessages[Math.floor(Math.random() * deployMessages.length)];
    text = msg;
  } else {
    // Scheduled weekly post
    const msg = weeklyMessages[Math.floor(Math.random() * weeklyMessages.length)];
    text = msg;
  }

  try {
    const tweet = await rwClient.v2.tweet(text);
    console.log('Posted to X:', tweet.data.id);
  } catch (e) {
    console.error('Failed to post:', e.message);
    process.exit(1);
  }
}

run();
