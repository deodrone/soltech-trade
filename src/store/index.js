import { createStore } from 'vuex';
import wallet from './modules/wallet';
import tokens from './modules/tokens';
import trading from './modules/trading';
import analytics from './modules/analytics';
import alerts from './modules/alerts';

export default createStore({
  state: {
    user: null,
    authReady: false,
    tokenRefreshing: false,
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } : null;
      state.authReady = true;
    },
    SET_TOKEN_REFRESHING(state, value) { state.tokenRefreshing = value; },
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    authReady: (state) => state.authReady,
    tokenRefreshing: (state) => state.tokenRefreshing,
    currentUser: (state) => state.user,
  },
  modules: { wallet, tokens, trading, analytics, alerts },
});
