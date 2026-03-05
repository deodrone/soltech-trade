<template>
  <div class="chart-wrapper">
    <div class="chart-controls">
      <button
        v-for="tf in timeframes" :key="tf"
        :class="['tf-btn', { active: currentTf === tf }]"
        @click="setTimeframe(tf)"
      >{{ tf }}</button>
      <div class="chart-type-btns">
        <button :class="['tf-btn', { active: chartType === 'candlestick' }]" @click="setChartType('candlestick')">Candles</button>
        <button :class="['tf-btn', { active: chartType === 'line' }]" @click="setChartType('line')">Line</button>
      </div>
      <div class="chart-indicators">
        <button :class="['tf-btn', { active: showEma9 }]" @click="showEma9 = !showEma9" title="EMA 9">EMA9</button>
        <button :class="['tf-btn', { active: showEma21 }]" @click="showEma21 = !showEma21" title="EMA 21">EMA21</button>
        <button :class="['tf-btn', { active: showEma50 }]" @click="showEma50 = !showEma50" title="EMA 50">EMA50</button>
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

function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const result = [];
  let ema = null;
  for (const d of data) {
    if (ema === null) {
      ema = d.close;
    } else {
      ema = d.close * k + ema * (1 - k);
    }
    result.push({ time: d.time, value: +ema.toFixed(10) });
  }
  return result;
}

export default {
  props: { tokenMint: { type: String, default: 'So11111111111111111111111111111111111111112' } },
  setup(props) {
    const store = useStore();
    const { getOHLCV, ohlcvToChartData } = useBirdeye();
    const chartContainer = ref(null);
    const loading = ref(false);
    const error = ref('');
    const chartType = ref('candlestick');
    const showEma9 = ref(true);
    const showEma21 = ref(true);
    const showEma50 = ref(false);
    const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D'];
    const currentTf = computed(() => store.getters['trading/timeframe']);

    let chart = null;
    let series = null;
    let volumeSeries = null;
    let ema9Series = null;
    let ema21Series = null;
    let ema50Series = null;
    let resizeObserver = null;
    let lastData = [];

    function initChart() {
      if (!chartContainer.value) return;
      chart = createChart(chartContainer.value, {
        layout: { background: { color: '#0d1117' }, textColor: '#8b949e' },
        grid: { vertLines: { color: '#161b22' }, horzLines: { color: '#161b22' } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#21262d' },
        timeScale: { borderColor: '#21262d', timeVisible: true, secondsVisible: false },
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
      if (series) { chart.removeSeries(series); series = null; }
      if (volumeSeries) { chart.removeSeries(volumeSeries); volumeSeries = null; }
      if (ema9Series) { chart.removeSeries(ema9Series); ema9Series = null; }
      if (ema21Series) { chart.removeSeries(ema21Series); ema21Series = null; }
      if (ema50Series) { chart.removeSeries(ema50Series); ema50Series = null; }

      if (chartType.value === 'candlestick') {
        series = chart.addCandlestickSeries({
          upColor: '#3fb950', downColor: '#f85149',
          borderUpColor: '#3fb950', borderDownColor: '#f85149',
          wickUpColor: '#3fb950', wickDownColor: '#f85149',
          priceScaleId: 'right',
        });
      } else {
        series = chart.addAreaSeries({
          lineColor: '#58a6ff', topColor: 'rgba(88,166,255,0.18)',
          bottomColor: 'rgba(88,166,255,0)', lineWidth: 2,
          priceScaleId: 'right',
        });
      }

      volumeSeries = chart.addHistogramSeries({
        color: '#30363d',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, visible: false });

      if (showEma9.value) {
        ema9Series = chart.addLineSeries({ color: '#f0a500', lineWidth: 1, priceScaleId: 'right', lastValueVisible: false, priceLineVisible: false });
      }
      if (showEma21.value) {
        ema21Series = chart.addLineSeries({ color: '#58a6ff', lineWidth: 1, priceScaleId: 'right', lastValueVisible: false, priceLineVisible: false });
      }
      if (showEma50.value) {
        ema50Series = chart.addLineSeries({ color: '#d2a8ff', lineWidth: 1, priceScaleId: 'right', lastValueVisible: false, priceLineVisible: false });
      }

      if (lastData.length) applyData(lastData);
    }

    function applyData(data) {
      if (!series || !data.length) return;
      if (chartType.value === 'line') {
        series.setData(data.map(d => ({ time: d.time, value: d.close })));
      } else {
        series.setData(data);
      }
      if (volumeSeries) {
        volumeSeries.setData(data.map(d => ({
          time: d.time, value: d.value || 0,
          color: d.close >= d.open ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)',
        })));
      }
      if (ema9Series && showEma9.value) ema9Series.setData(calcEMA(data, 9));
      if (ema21Series && showEma21.value) ema21Series.setData(calcEMA(data, 21));
      if (ema50Series && showEma50.value) ema50Series.setData(calcEMA(data, 50));
      chart.timeScale().fitContent();
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
          lastData = data;
          applyData(data);
        } else {
          error.value = 'No chart data available';
        }
      } catch {
        error.value = 'Failed to load chart data';
      } finally {
        loading.value = false;
      }
    }

    function setTimeframe(tf) { store.commit('trading/SET_TIMEFRAME', tf); }
    function setChartType(type) { chartType.value = type; if (chart) { addSeries(); } }

    onMounted(() => { initChart(); loadData(); });
    onUnmounted(() => {
      if (resizeObserver) resizeObserver.disconnect();
      if (chart) chart.remove();
    });

    watch(() => currentTf.value, () => loadData());
    watch(() => props.tokenMint, () => loadData());
    watch([showEma9, showEma21, showEma50], () => { if (chart) addSeries(); });

    return { chartContainer, loading, error, timeframes, currentTf, chartType, showEma9, showEma21, showEma50, setTimeframe, setChartType };
  },
};
</script>

<style scoped>
.chart-wrapper { position: relative; display: flex; flex-direction: column; height: 100%; background: #0d1117; }
.chart-controls { display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-bottom: 1px solid #21262d; flex-wrap: wrap; }
.chart-type-btns { margin-left: 8px; display: flex; gap: 4px; border-left: 1px solid #21262d; padding-left: 8px; }
.chart-indicators { margin-left: 8px; display: flex; gap: 4px; border-left: 1px solid #21262d; padding-left: 8px; }
.tf-btn { padding: 3px 8px; background: transparent; border: 1px solid transparent; border-radius: 4px; color: #8b949e; font-size: 0.72rem; cursor: pointer; transition: all 0.12s; }
.tf-btn:hover { color: #e6edf3; border-color: #30363d; }
.tf-btn.active { color: #58a6ff; border-color: #58a6ff; background: rgba(88,166,255,0.1); }
.chart-container { flex: 1; min-height: 320px; }
.chart-loading, .chart-error { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #8b949e; font-size: 0.85rem; pointer-events: none; }
.chart-error { color: #f85149; }
</style>
