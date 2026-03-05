export default {
  namespaced: true,
  state: () => ({
    inputMint: 'So11111111111111111111111111111111111111112',  // SOL
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    inputAmount: '',
    quoteResult: null,
    quoteLoading: false,
    swapping: false,
    slippage: 1.0,      // percent
    priorityFee: 'medium', // low|medium|high|turbo
    useJito: true,       // MEV protection
    orderHistory: [],
    limitOrders: [],
    timeframe: '1H',
  }),
  mutations: {
    SET_INPUT_MINT(state, mint) { state.inputMint = mint; },
    SET_OUTPUT_MINT(state, mint) { state.outputMint = mint; },
    SET_INPUT_AMOUNT(state, amt) { state.inputAmount = amt; },
    SET_QUOTE(state, quote) { state.quoteResult = quote; },
    SET_QUOTE_LOADING(state, val) { state.quoteLoading = val; },
    SET_SWAPPING(state, val) { state.swapping = val; },
    SET_SLIPPAGE(state, val) { state.slippage = val; },
    SET_PRIORITY_FEE(state, val) { state.priorityFee = val; },
    SET_JITO(state, val) { state.useJito = val; },
    SET_TIMEFRAME(state, val) { state.timeframe = val; },
    ADD_ORDER(state, order) { state.orderHistory.unshift(order); },
    SET_LIMIT_ORDERS(state, orders) { state.limitOrders = orders; },
    SWAP_TOKENS(state) {
      const tmp = state.inputMint;
      state.inputMint = state.outputMint;
      state.outputMint = tmp;
      state.quoteResult = null;
    },
  },
  getters: {
    inputMint: s => s.inputMint,
    outputMint: s => s.outputMint,
    quoteResult: s => s.quoteResult,
    slippage: s => s.slippage,
    useJito: s => s.useJito,
    timeframe: s => s.timeframe,
  },
};
