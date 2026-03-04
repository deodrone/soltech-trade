import { createStore } from 'vuex';

export default createStore({
  state: {
    user: null,
    authReady: false,
    tokenRefreshing: false,
    portfolio: [],
    marketData: []
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } : null;
      state.authReady = true;
    },
    SET_TOKEN_REFRESHING(state, value) { state.tokenRefreshing = value; },
    SET_PORTFOLIO(state, portfolio) { state.portfolio = portfolio; },
    SET_MARKET_DATA(state, data) { state.marketData = data; }
  },
  actions: {
    setPortfolio({ commit }, portfolio) { commit('SET_PORTFOLIO', portfolio); },
    setMarketData({ commit }, data) { commit('SET_MARKET_DATA', data); }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    authReady: (state) => state.authReady,
    tokenRefreshing: (state) => state.tokenRefreshing,
    currentUser: (state) => state.user,
    portfolio: (state) => state.portfolio,
    marketData: (state) => state.marketData
  }
});
