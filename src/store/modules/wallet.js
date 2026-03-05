export default {
  namespaced: true,
  state: () => ({
    connected: false,
    publicKey: null,
    walletName: null,
    balanceSol: 0,
    tokens: [],
    connecting: false,
  }),
  mutations: {
    SET_CONNECTED(state, { publicKey, walletName }) {
      state.connected = true;
      state.publicKey = publicKey;
      state.walletName = walletName;
      state.connecting = false;
    },
    SET_DISCONNECTED(state) {
      state.connected = false;
      state.publicKey = null;
      state.walletName = null;
      state.balanceSol = 0;
      state.tokens = [];
    },
    SET_CONNECTING(state, val) { state.connecting = val; },
    SET_BALANCE(state, sol) { state.balanceSol = sol; },
    SET_TOKENS(state, tokens) { state.tokens = tokens; },
  },
  getters: {
    isConnected: s => s.connected,
    publicKey: s => s.publicKey,
    shortKey: s => s.publicKey ? `${s.publicKey.slice(0,4)}...${s.publicKey.slice(-4)}` : null,
    tokens: s => s.tokens,
    balanceSol: s => s.balanceSol,
  },
};
