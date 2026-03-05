<template>
  <div class="bonding-curve">
    <div class="bc-header">
      <span>Bonding Curve Visualizer</span>
      <div class="curve-tabs">
        <button v-for="c in curves" :key="c" :class="['ctab', { active: selected === c }]" @click="selected = c">{{ c }}</button>
      </div>
    </div>
    <div class="bc-controls">
      <label>Initial Price (SOL): <input v-model.number="initPrice" type="number" min="0.000001" step="0.000001" class="ctrl-input" /></label>
      <label>Migration (SOL): <input v-model.number="migration" type="number" min="1" class="ctrl-input" /></label>
    </div>
    <canvas ref="canvas" class="bc-canvas" />
    <div class="bc-legend">
      <div class="legend-item"><span class="dot blue" /> Price curve</div>
      <div class="legend-item"><span class="dot orange" /> Migration threshold</div>
    </div>
    <div class="bc-info">
      <div class="info-item"><span class="il">At 25% supply sold</span><span class="iv">${{ calcPrice(0.25) }}</span></div>
      <div class="info-item"><span class="il">At 50% supply sold</span><span class="iv">${{ calcPrice(0.50) }}</span></div>
      <div class="info-item"><span class="il">At 75% supply sold</span><span class="iv">${{ calcPrice(0.75) }}</span></div>
      <div class="info-item"><span class="il">At migration</span><span class="iv">{{ migration }} SOL raised</span></div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, nextTick } from 'vue';

export default {
  props: {
    curveType: { type: String, default: 'linear' },
    initialPrice: { type: Number, default: 0.000001 },
    migrationThreshold: { type: Number, default: 85 },
  },
  emits: ['update:curveType', 'update:initialPrice', 'update:migrationThreshold'],
  setup(props, { emit }) {
    const canvas = ref(null);
    const curves = ['Linear', 'Exponential', 'Logarithmic'];
    const selected = ref(props.curveType.charAt(0).toUpperCase() + props.curveType.slice(1));
    const initPrice = ref(props.initialPrice);
    const migration = ref(props.migrationThreshold);

    function priceAt(pct) {
      const t = props.curveType.toLowerCase();
      const p0 = initPrice.value;
      if (t === 'linear') return p0 + (pct * p0 * 1000);
      if (t === 'exponential') return p0 * Math.exp(pct * 6);
      if (t === 'logarithmic') return p0 * (1 + Math.log1p(pct * 10) * 100);
      return p0;
    }

    function calcPrice(pct) {
      const p = priceAt(pct);
      if (p < 0.001) return p.toExponential(3);
      return p.toFixed(6);
    }

    function draw() {
      const c = canvas.value;
      if (!c) return;
      const ctx = c.getContext('2d');
      const W = c.width = c.offsetWidth;
      const H = c.height = 200;
      ctx.clearRect(0, 0, W, H);

      const points = 100;
      const prices = Array.from({ length: points }, (_, i) => priceAt(i / (points - 1)));
      const maxP = Math.max(...prices);

      // Grid
      ctx.strokeStyle = '#21262d';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * H;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Curve
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      prices.forEach((p, i) => {
        const x = (i / (points - 1)) * W;
        const y = H - (p / maxP) * (H - 20);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Migration line (at ~85% of x)
      const migX = 0.85 * W;
      ctx.strokeStyle = '#f0883e88';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(migX, 0); ctx.lineTo(migX, H); ctx.stroke();
      ctx.setLineDash([]);
    }

    watch([selected, initPrice, migration], () => {
      emit('update:curveType', selected.value.toLowerCase());
      emit('update:initialPrice', initPrice.value);
      emit('update:migrationThreshold', migration.value);
      nextTick(draw);
    });

    onMounted(() => nextTick(draw));

    return { canvas, curves, selected, initPrice, migration, calcPrice };
  }
};
</script>

<style scoped>
.bonding-curve { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 16px; }
.bc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: 600; color: #e6edf3; font-size: 0.85rem; }
.curve-tabs { display: flex; gap: 4px; }
.ctab { padding: 3px 10px; background: none; border: 1px solid #30363d; border-radius: 4px; color: #8b949e; cursor: pointer; font-size: 0.72rem; }
.ctab.active { border-color: #58a6ff; color: #58a6ff; }
.bc-controls { display: flex; gap: 20px; margin-bottom: 12px; font-size: 0.78rem; color: #8b949e; }
.ctrl-input { margin-left: 6px; background: #0d1117; border: 1px solid #30363d; border-radius: 4px; padding: 3px 8px; color: #e6edf3; font-size: 0.78rem; width: 90px; outline: none; }
.bc-canvas { width: 100%; height: 200px; display: block; }
.bc-legend { display: flex; gap: 16px; margin: 8px 0; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: #8b949e; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot.blue { background: #58a6ff; }
.dot.orange { background: #f0883e; }
.bc-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
.info-item { background: #0d1117; border-radius: 6px; padding: 8px; text-align: center; }
.il { font-size: 0.65rem; color: #8b949e; display: block; margin-bottom: 2px; }
.iv { font-size: 0.78rem; color: #e6edf3; font-family: monospace; }
</style>
