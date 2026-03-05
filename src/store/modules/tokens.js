export default {
  namespaced: true,
  state: () => ({
    tokenList: [],        // Jupiter full token list
    tokenMap: {},         // mint -> token info
    trending: [],         // DexScreener trending
    newLaunches: [],      // Pump.fun new tokens
    selectedToken: null,  // currently viewed token
    searchResults: [],
  }),
  mutations: {
    SET_TOKEN_LIST(state, list) {
      state.tokenList = list;
      const map = {};
      list.forEach(t => { map[t.address] = t; });
      state.tokenMap = map;
    },
    SET_TRENDING(state, tokens) { state.trending = tokens; },
    SET_NEW_LAUNCHES(state, tokens) { state.newLaunches = tokens; },
    SET_SELECTED_TOKEN(state, token) { state.selectedToken = token; },
    SET_SEARCH_RESULTS(state, results) { state.searchResults = results; },
    CACHE_TOKEN(state, token) { state.tokenMap = { ...state.tokenMap, [token.address]: token }; },
  },
  getters: {
    getByMint: s => mint => s.tokenMap[mint] || null,
    trending: s => s.trending,
    newLaunches: s => s.newLaunches,
    selectedToken: s => s.selectedToken,
  },
};
