export default {
  namespaced: true,
  state: () => ({
    activeAlerts: [],
    alertHistory: [],
    wsConnected: false,
  }),
  mutations: {
    SET_ALERTS(state, alerts) { state.activeAlerts = alerts; },
    ADD_ALERT(state, alert) { state.activeAlerts.push(alert); },
    REMOVE_ALERT(state, id) {
      state.activeAlerts = state.activeAlerts.filter(a => a._id !== id);
    },
    ADD_HISTORY(state, event) { state.alertHistory.unshift(event); },
    SET_WS_CONNECTED(state, val) { state.wsConnected = val; },
  },
  getters: {
    activeAlerts: s => s.activeAlerts,
    alertHistory: s => s.alertHistory,
    wsConnected: s => s.wsConnected,
  },
};
