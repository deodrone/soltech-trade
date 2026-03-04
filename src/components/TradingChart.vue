<template>
  <div class="chart-card">
    <h2>Trading Chart</h2>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import api from '../config/api';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'TradingChart',
  data() {
    return { chart: null };
  },
  mounted() {
    this.fetchChartData();
  },
  beforeUnmount() {
    if (this.chart) this.chart.destroy();
  },
  methods: {
    async fetchChartData() {
      try {
        const response = await api.get('/api/chart-data');
        this.createChart(response.data);
      } catch {
        this.createChart(this.mockData());
      }
    },
    mockData() {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        prices: [42000, 43500, 41800, 44200, 45100, 43800, 46000]
      };
    },
    createChart(data) {
      this.chart = new Chart(this.$refs.chartCanvas, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Price (USD)',
            data: data.prices,
            borderColor: '#58a6ff',
            backgroundColor: 'rgba(88, 166, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#e6edf3' } } },
          scales: {
            x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } },
            y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.chart-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
}
h2 { color: #58a6ff; margin-bottom: 16px; }
</style>
