export default {
  namespaced: true,
  state: () => ({
    watchedWallets: [],
    copyTrades: [],
    smartMoneyData: [],
    walletPnl: {},
  }),
  mutations: {
    SET_WATCHED_WALLETS(state, wallets) { state.watchedWallets = wallets; },
    ADD_WATCHED_WALLET(state, wallet) { state.watchedWallets.push(wallet); },
    REMOVE_WATCHED_WALLET(state, address) {
      state.watchedWallets = state.watchedWallets.filter(w => w.walletAddress !== address);
    },
    SET_COPY_TRADES(state, trades) { state.copyTrades = trades; },
    SET_SMART_MONEY(state, data) { state.smartMoneyData = data; },
    SET_WALLET_PNL(state, { address, pnl }) { state.walletPnl[address] = pnl; },
  },
  getters: {
    watchedWallets: s => s.watchedWallets,
    copyTrades: s => s.copyTrades,
    smartMoneyData: s => s.smartMoneyData,
    getWalletPnl: s => address => s.walletPnl[address] || null,
  },
};
