<template>
  <div class="token-filters">
    <div class="filters-header">
      <span class="filters-title">Filters</span>
      <button class="reset-btn" @click="reset">Reset</button>
    </div>

    <div class="filters-grid">
      <!-- MCap -->
      <div class="filter-group">
        <label>Market Cap ($)</label>
        <div class="range-row">
          <input v-model.number="local.mcapMin" type="number" placeholder="Min" class="range-input" @change="emit" />
          <span class="range-sep">—</span>
          <input v-model.number="local.mcapMax" type="number" placeholder="Max" class="range-input" @change="emit" />
        </div>
        <div class="quick-vals">
          <button v-for="q in mcapQuick" :key="q.label" class="quick-btn" @click="setMcap(q)">{{ q.label }}</button>
        </div>
      </div>

      <!-- Volume 24h -->
      <div class="filter-group">
        <label>Volume 24h ($)</label>
        <div class="range-row">
          <input v-model.number="local.volMin" type="number" placeholder="Min" class="range-input" @change="emit" />
          <span class="range-sep">—</span>
          <input v-model.number="local.volMax" type="number" placeholder="Max" class="range-input" @change="emit" />
        </div>
      </div>

      <!-- Liquidity -->
      <div class="filter-group">
        <label>Liquidity ($)</label>
        <div class="range-row">
          <input v-model.number="local.liqMin" type="number" placeholder="Min" class="range-input" @change="emit" />
          <span class="range-sep">—</span>
          <input v-model.number="local.liqMax" type="number" placeholder="Max" class="range-input" @change="emit" />
        </div>
      </div>

      <!-- Age -->
      <div class="filter-group">
        <label>Age (minutes)</label>
        <div class="range-row">
          <input v-model.number="local.ageMinMins" type="number" placeholder="Min" class="range-input" @change="emit" min="0" />
          <span class="range-sep">—</span>
          <input v-model.number="local.ageMaxMins" type="number" placeholder="Max" class="range-input" @change="emit" min="0" />
        </div>
        <div class="quick-vals">
          <button v-for="q in ageQuick" :key="q.label" class="quick-btn" @click="setAge(q)">{{ q.label }}</button>
        </div>
      </div>

      <!-- 24h Change -->
      <div class="filter-group">
        <label>24h Change (%)</label>
        <div class="range-row">
          <input v-model.number="local.changeMin" type="number" placeholder="-100" class="range-input" @change="emit" />
          <span class="range-sep">—</span>
          <input v-model.number="local.changeMax" type="number" placeholder="1000" class="range-input" @change="emit" />
        </div>
        <div class="quick-vals">
          <button class="quick-btn green" @click="setPosChange">Gainers only</button>
          <button class="quick-btn red" @click="setNegChange">Losers only</button>
        </div>
      </div>

      <!-- Buy/Sell ratio -->
      <div class="filter-group">
        <label>Min Buys (24h)</label>
        <input v-model.number="local.minBuys" type="number" placeholder="0" class="range-input full" min="0" @change="emit" />
      </div>

      <!-- Security -->
      <div class="filter-group">
        <label>Safety</label>
        <div class="checkbox-list">
          <label class="check-item">
            <input type="checkbox" v-model="local.noMintAuth" @change="emit" />
            <span>No Mint Authority</span>
          </label>
          <label class="check-item">
            <input type="checkbox" v-model="local.noFreezeAuth" @change="emit" />
            <span>No Freeze Authority</span>
          </label>
        </div>
      </div>
    </div>

    <div class="active-filters" v-if="activeCount > 0">
      <span class="active-count">{{ activeCount }} filter{{ activeCount > 1 ? 's' : '' }} active</span>
      <button class="apply-btn" @click="emit">Apply</button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

const DEFAULT = {
  mcapMin: null, mcapMax: null,
  volMin: null,  volMax: null,
  liqMin: null,  liqMax: null,
  ageMinMins: null, ageMaxMins: null,
  changeMin: null, changeMax: null,
  minBuys: null,
  noMintAuth: false, noFreezeAuth: false,
};

export default {
  name: 'TokenFilters',
  emits: ['update'],
  setup(_, { emit: vEmit }) {
    const local = ref({ ...DEFAULT });

    const mcapQuick = [
      { label: '<100K',  min: 0,    max: 100000 },
      { label: '<1M',    min: 0,    max: 1000000 },
      { label: '1M–10M', min: 1e6,  max: 10e6 },
      { label: '>10M',   min: 10e6, max: null },
    ];
    const ageQuick = [
      { label: '<1h',   min: 0,    max: 60 },
      { label: '<6h',   min: 0,    max: 360 },
      { label: '<24h',  min: 0,    max: 1440 },
      { label: 'New (5m)', min: 0, max: 5 },
    ];

    function setMcap(q) { local.value.mcapMin = q.min; local.value.mcapMax = q.max; emit(); }
    function setAge(q)  { local.value.ageMinMins = q.min; local.value.ageMaxMins = q.max; emit(); }
    function setPosChange() { local.value.changeMin = 0; local.value.changeMax = null; emit(); }
    function setNegChange() { local.value.changeMin = null; local.value.changeMax = 0; emit(); }

    function emit() { vEmit('update', { ...local.value }); }
    function reset() { local.value = { ...DEFAULT }; emit(); }

    const activeCount = computed(() =>
      Object.entries(local.value).filter(([, v]) => v !== null && v !== false && v !== '').length
    );

    return { local, mcapQuick, ageQuick, activeCount, setMcap, setAge, setPosChange, setNegChange, emit, reset };
  },
};
</script>

<style scoped>
.token-filters { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px; }
.filters-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.filters-title { font-size: 0.82rem; font-weight: 600; color: #e6edf3; }
.reset-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 4px; padding: 3px 10px; cursor: pointer; font-size: 0.75rem; }
.reset-btn:hover { border-color: #f85149; color: #f85149; }
.filters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group label { font-size: 0.7rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.04em; }
.range-row { display: flex; align-items: center; gap: 5px; }
.range-sep { color: #8b949e; font-size: 0.8rem; }
.range-input { flex: 1; width: 0; background: #21262d; border: 1px solid #30363d; border-radius: 5px; padding: 6px 8px; color: #e6edf3; font-size: 0.8rem; outline: none; }
.range-input:focus { border-color: #58a6ff; }
.range-input.full { width: 100%; }
.quick-vals { display: flex; flex-wrap: wrap; gap: 4px; }
.quick-btn { padding: 3px 7px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #8b949e; cursor: pointer; font-size: 0.7rem; }
.quick-btn:hover, .quick-btn.active { border-color: #58a6ff; color: #58a6ff; }
.quick-btn.green { color: #3fb950; border-color: rgba(63,185,80,0.4); background: rgba(63,185,80,0.08); }
.quick-btn.red   { color: #f85149; border-color: rgba(248,81,73,0.4); background: rgba(248,81,73,0.08); }
.checkbox-list { display: flex; flex-direction: column; gap: 6px; }
.check-item { display: flex; align-items: center; gap: 7px; cursor: pointer; font-size: 0.78rem; color: #8b949e; }
.check-item input[type=checkbox] { accent-color: #58a6ff; }
.active-filters { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid #21262d; }
.active-count { font-size: 0.78rem; color: #58a6ff; }
.apply-btn { padding: 5px 14px; background: #1f6feb; border: none; border-radius: 5px; color: #fff; font-size: 0.78rem; cursor: pointer; font-weight: 600; }
</style>
