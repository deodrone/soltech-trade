<template>
  <span :class="['price-change', positive ? 'up' : 'down']">
    {{ positive ? '+' : '' }}{{ formatted }}%
  </span>
</template>

<script>
export default {
  props: { value: { type: Number, default: 0 } },
  computed: {
    positive() { return this.value >= 0; },
    formatted() { return Math.abs(this.value).toFixed(2); },
  },
};
</script>

<style scoped>
.price-change { font-size: 0.8rem; font-weight: 600; padding: 2px 5px; border-radius: 3px; }
.up   { color: #3fb950; background: rgba(63,185,80,0.12); }
.down { color: #f85149; background: rgba(248,81,73,0.12); }
</style>
