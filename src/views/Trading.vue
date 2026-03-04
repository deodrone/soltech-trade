<template>
  <div class="trading-page">
    <div class="trading-grid">
      <TradingChart />
      <OrderBook />
    </div>
  </div>
</template>

<script>
import TradingChart from '../components/TradingChart.vue';
import OrderBook from '../components/OrderBook.vue';

export default {
  name: 'TradingView',
  components: { TradingChart, OrderBook }
};
</script>

<style scoped>
.trading-page { padding: 24px; }
.trading-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
</style>
