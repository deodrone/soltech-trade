<template>
  <div class="chart-wrapper">
    <div class="chart-controls">
      <button
        v-for="tf in timeframes" :key="tf"
        :class="['tf-btn', { active: currentTf === tf }]"
        @click="setTimeframe(tf)"
      >{{ tf }}</button>
      <div class="chart-type-btns">
        <button :class="['tf-btn', { active: chartType === 'candlestick' }]" @click="chartType = 'candlestick'">Candles</button>
        <button :class="['tf-btn', { active: chartType === 'line' }]" @click="chartType = 'line'">Line</button>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" />
    <div v-if="loading" class="chart-loading">Loading chart...</div>
    <div v-if="error" class="chart-error">{{ error }}</div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { useStore } from 'vuex';
import { useBirdeye } from '../../composables/useBirdeye';

const TF_MAP = { '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1H', '4H': '4H', '1D': '1D' };

export default {
  props: { tokenMint: { type: String, default: 'So11111111111111111111111111111111111111112' } },
  setup(props) {
    const store = useStore();
    const { getOHLCV, ohlcvToChartData } = useBirdeye();
    const chartContainer = ref(null);
    const loading = ref(false);
    const error = ref('');
    const chartType = ref('candlestick');
    const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D'];
    const currentTf = computed(() => store.getters['trading/timeframe']);

    let chart = null;
    let series = null;
    let volumeSeries = null;
    let resizeObserver = null;

    function initChart() {
      if (!chartContainer.value) return;
      chart = createChart(chartContainer.value, {
        layout: { background: { color: '#0d1117' }, textColor: '#8b949e' },
        grid: { vertLines: { color: '#21262d' }, horzLines: { color: '#21262d' } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#30363d' },
        timeScale: { borderColor: '#30363d', timeVisible: true, secondsVisible: false },
        width: chartContainer.value.clientWidth,
        height: chartContainer.value.clientHeight || 380,
      });
      addSeries();
      resizeObserver = new ResizeObserver(() => {
        if (chart && chartContainer.value) {
          chart.applyOptions({ width: chartContainer.value.clientWidth, height: chartContainer.value.clientHeight });
        }
      });
      resizeObserver.observe(chartContainer.value);
    }

    function addSeries() {
      if (series) chart.removeSeries(series);
      if (volumeSeries) { chart.removeSeries(volumeSeries); volumeSeries = null; }

      if (chartType.value === 'candlestick') {
        series = chart.addCandlestickSeries({
          upColor: '#3fb950', downColor: '#f85149',
          borderUpColor: '#3fb950', borderDownColor: '#f85149',
          wickUpColor: '#3fb950', wickDownColor: '#f85149',
          priceScaleId: 'right',
        });
      } else {
        series = chart.addAreaSeries({
          lineColor: '#58a6ff', topColor: 'rgba(88,166,255,0.2)',
          bottomColor: 'rgba(88,166,255,0)', lineWidth: 2,
          priceScaleId: 'right',
        });
      }

      // Volume bars on a separate scale
      volumeSeries = chart.addHistogramSeries({
        color: '#30363d',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 }, visible: false });
    }

    async function loadData() {
      if (!props.tokenMint) return;
      loading.value = true; error.value = '';
      try {
        const now = Math.floor(Date.now() / 1000);
        const from = now - (300 * 60 * 60);
        const items = await getOHLCV({ address: props.tokenMint, type: TF_MAP[currentTf.value], timeFrom: from, timeTo: now });
        const data = ohlcvToChartData(items);
        if (data.length) {
          if (chartType.value === 'line') {
            series.setData(data.map(d => ({ time: d.time, value: d.close })));
          } else {
            series.setData(data);
          }
          if (volumeSeries) {
            volumeSeries.setData(data.map(d => ({
              time: d.time,
              value: d.value || 0,
              color: d.close >= d.open ? 'rgba(63,185,80,0.35)' : 'rgba(248,81,73,0.35)',
            })));
          }
          chart.timeScale().fitContent();
        } else {
          error.value = 'No chart data available';
        }
      } catch {
        error.value = 'Failed to load chart data';
      } finally {
        loading.value = false;
      }
    }

    function setTimeframe(tf) {
      store.commit('trading/SET_TIMEFRAME', tf);
    }

    onMounted(() => { initChart(); loadData(); });
    onUnmounted(() => {
      if (resizeObserver) resizeObserver.disconnect();
      if (chart) chart.remove();
    });

    watch(() => currentTf.value, () => loadData());
    watch(() => props.tokenMint, () => loadData());
    watch(chartType, () => { if (chart) { addSeries(); loadData(); } });

    return { chartContainer, loading, error, timeframes, currentTf, chartType, setTimeframe };
  },
};
</script>

<style scoped>
.chart-wrapper { position: relative; display: flex; flex-direction: column; height: 100%; background: #0d1117; }
.chart-controls { display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-bottom: 1px solid #21262d; flex-wrap: wrap; }
.chart-type-btns { margin-left: auto; display: flex; gap: 4px; }
.tf-btn { padding: 3px 8px; background: transparent; border: 1px solid transparent; border-radius: 4px; color: #8b949e; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; }
.tf-btn:hover { color: #e6edf3; border-color: #30363d; }
.tf-btn.active { color: #58a6ff; border-color: #58a6ff; background: rgba(88,166,255,0.1); }
.chart-container { flex: 1; min-height: 320px; }
.chart-loading, .chart-error { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #8b949e; font-size: 0.85rem; }
.chart-error { color: #f85149; }
</style>
