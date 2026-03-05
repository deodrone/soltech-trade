<template>
  <div class="stat-card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <div v-if="sub" class="sub" :class="subClass">{{ sub }}</div>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    value: String,
    sub: String,
    subClass: String,
  },
};
</script>

<style scoped>
.stat-card { padding: 8px 12px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; min-width: 90px; }
.label { font-size: 0.68rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
.value { font-size: 0.9rem; font-weight: 600; color: #e6edf3; }
.sub { font-size: 0.75rem; margin-top: 1px; }
.up { color: #3fb950; }
.down { color: #f85149; }
</style>
