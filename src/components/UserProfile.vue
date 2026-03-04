<template>
  <div class="profile-card">
    <div class="avatar">{{ initials }}</div>
    <div class="info">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
    </div>
    <div class="stats">
      <div class="stat">
        <span class="label">Portfolio Value</span>
        <span class="value">${{ user.portfolioValue }}</span>
      </div>
      <div class="stat">
        <span class="label">24h P&amp;L</span>
        <span :class="['value', user.pnl >= 0 ? 'positive' : 'negative']">
          {{ user.pnl >= 0 ? '+' : '' }}{{ user.pnl }}%
        </span>
      </div>
      <div class="stat">
        <span class="label">Open Orders</span>
        <span class="value">{{ user.openOrders }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      user: {
        name: 'Demo User',
        email: 'user@soltech.trade',
        portfolioValue: '12,450.00',
        pnl: 3.24,
        openOrders: 2
      }
    };
  },
  computed: {
    initials() {
      return this.user.name.split(' ').map(n => n[0]).join('');
    }
  }
};
</script>

<style scoped>
.profile-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 400px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #238636;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}
.info h3 { color: #e6edf3; }
.info p { color: #8b949e; font-size: 0.9rem; }
.stats { display: flex; flex-direction: column; gap: 12px; }
.stat { display: flex; justify-content: space-between; }
.label { color: #8b949e; }
.value { font-weight: bold; }
.positive { color: #3fb950; }
.negative { color: #f85149; }
</style>
