const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: false,

  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 10,
        minSize: 20000,
        cacheGroups: {
          // Solana web3.js core
          solana: {
            test: /[\\/]node_modules[\\/]@solana[\\/]/,
            name: 'vendor-solana',
            priority: 32,
            reuseExistingChunk: true,
          },
          // Solana crypto primitives (noble, tweetnacl, bs58, borsh)
          solanaCrypto: {
            test: /[\\/]node_modules[\\/](@noble|tweetnacl|bs58|borsh|@project-serum)[\\/]/,
            name: 'vendor-solana-crypto',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Firebase — large, rarely changes
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'vendor-firebase',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Charts — loaded only on trading pages
          charts: {
            test: /[\\/]node_modules[\\/](lightweight-charts|chart\.js|chartjs-.*)[\\/]/,
            name: 'vendor-charts',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Vue ecosystem
          vue: {
            test: /[\\/]node_modules[\\/](vue|vue-router|vuex|@vue)[\\/]/,
            name: 'vendor-vue',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Everything else
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor-misc',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    },

    performance: {
      hints: false, // Individual chunks are all under 250KB; gzipped transfer is ~250KB total
    },
  },
});
