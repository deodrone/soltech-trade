<template>
  <div class="token-logo" :style="{ width: size+'px', height: size+'px' }">
    <img v-if="src && !imgError" :src="src" :alt="symbol" @error="imgError = true" />
    <span v-else class="fallback" :style="{ fontSize: (size*0.4)+'px' }">
      {{ symbol ? symbol.slice(0,3) : '?' }}
    </span>
  </div>
</template>

<script>
export default {
  props: {
    src: String,
    symbol: String,
    size: { type: Number, default: 32 },
  },
  data() { return { imgError: false }; },
  watch: { src() { this.imgError = false; } },
};
</script>

<style scoped>
.token-logo {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #21262d;
  display: flex; align-items: center; justify-content: center;
}
.token-logo img { width: 100%; height: 100%; object-fit: cover; }
.fallback { font-weight: 700; color: #8b949e; text-transform: uppercase; }
</style>
