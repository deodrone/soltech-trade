<template>
  <div class="order-book">
    <h2>Order Book</h2>
    <div class="section">
      <h3 class="asks-label">Asks</h3>
      <div v-for="(ask, i) in asks" :key="'ask-' + i" class="row ask">
        <span>{{ ask.price }}</span>
        <span>{{ ask.amount }}</span>
      </div>
    </div>
    <div class="mid-price">{{ midPrice }} USD</div>
    <div class="section">
      <h3 class="bids-label">Bids</h3>
      <div v-for="(bid, i) in bids" :key="'bid-' + i" class="row bid">
        <span>{{ bid.price }}</span>
        <span>{{ bid.amount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderBook',
  data() {
    return {
      asks: [
        { price: '46,200', amount: '0.42' },
        { price: '46,150', amount: '1.10' },
        { price: '46,100', amount: '0.75' },
        { price: '46,050', amount: '2.30' }
      ],
      bids: [
        { price: '46,000', amount: '1.85' },
        { price: '45,950', amount: '0.90' },
        { price: '45,900', amount: '3.10' },
        { price: '45,850', amount: '0.55' }
      ],
      midPrice: '46,000'
    };
  }
};
</script>

<style scoped>
.order-book {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
}
h2 { color: #58a6ff; margin-bottom: 12px; }
h3 { font-size: 0.85rem; margin-bottom: 6px; }
.asks-label { color: #f85149; }
.bids-label { color: #3fb950; }
.row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #21262d;
}
.ask { color: #f85149; }
.bid { color: #3fb950; }
.mid-price {
  text-align: center;
  font-weight: bold;
  font-size: 1rem;
  color: #e6edf3;
  padding: 10px 0;
}
</style>
