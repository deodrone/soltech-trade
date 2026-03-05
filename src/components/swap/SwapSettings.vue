<template>
  <div class="settings">
    <button class="settings-btn" @click="open = !open" title="Settings">⚙</button>
    <div v-if="open" class="settings-panel">
      <div class="setting-row">
        <label>Slippage</label>
        <div class="slippage-opts">
          <button v-for="opt in [0.5,1,2,5]" :key="opt" :class="['opt-btn', { active: slippage === opt }]" @click="setSlippage(opt)">{{ opt }}%</button>
          <input type="number" v-model.number="customSlippage" placeholder="Custom" class="custom-input" @change="setSlippage(customSlippage)" min="0.01" max="50" step="0.1" />
        </div>
      </div>
      <div class="setting-row">
        <label>Priority Fee</label>
        <div class="priority-opts">
          <button v-for="opt in ['low','medium','high','turbo']" :key="opt" :class="['opt-btn', { active: priorityFee === opt }]" @click="setPriority(opt)">{{ opt }}</button>
        </div>
      </div>
      <div class="setting-row jito-row">
        <label>MEV Protection (Jito)</label>
        <label class="toggle">
          <input type="checkbox" :checked="useJito" @change="toggleJito" />
          <span class="slider" />
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

export default {
  setup() {
    const store = useStore();
    const open = ref(false);
    const customSlippage = ref('');
    const slippage = computed(() => store.getters['trading/slippage']);
    const priorityFee = computed(() => store.state.trading.priorityFee);
    const useJito = computed(() => store.getters['trading/useJito']);

    const setSlippage = v => store.commit('trading/SET_SLIPPAGE', Number(v));
    const setPriority = v => store.commit('trading/SET_PRIORITY_FEE', v);
    const toggleJito = () => store.commit('trading/SET_JITO', !useJito.value);

    return { open, customSlippage, slippage, priorityFee, useJito, setSlippage, setPriority, toggleJito };
  },
};
</script>

<style scoped>
.settings { position: relative; }
.settings-btn { background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 6px; padding: 5px 8px; cursor: pointer; font-size: 1rem; }
.settings-btn:hover { border-color: #58a6ff; color: #58a6ff; }
.settings-panel { position: absolute; right: 0; top: 34px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px; z-index: 100; width: 260px; }
.setting-row { margin-bottom: 12px; }
.setting-row label { display: block; font-size: 0.75rem; color: #8b949e; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.slippage-opts, .priority-opts { display: flex; gap: 6px; flex-wrap: wrap; }
.opt-btn { padding: 4px 10px; background: #21262d; border: 1px solid #30363d; color: #8b949e; border-radius: 5px; cursor: pointer; font-size: 0.78rem; text-transform: capitalize; }
.opt-btn.active { border-color: #58a6ff; color: #58a6ff; background: rgba(88,166,255,0.1); }
.custom-input { width: 70px; padding: 4px 8px; background: #21262d; border: 1px solid #30363d; color: #e6edf3; border-radius: 5px; font-size: 0.78rem; }
.jito-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; }
.jito-row label:first-child { margin-bottom: 0; }
.toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
.toggle input { display: none; }
.slider { position: absolute; inset: 0; background: #30363d; border-radius: 20px; cursor: pointer; transition: background 0.2s; }
.slider::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
.toggle input:checked + .slider { background: #238636; }
.toggle input:checked + .slider::before { transform: translateX(16px); }
</style>
