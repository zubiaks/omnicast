// assets/js/modules/chartManager.js
import Chart from 'chart.js/auto';

/**
 * Cria um gráfico de linha com configurações padrão e método `push` para adicionar pontos.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} label           — legenda da série
 * @param {string} borderColor     — cor da linha
 * @param {number} maxPoints       — número máximo de pontos no gráfico
 * @returns {Chart & { push: (value: number) => void }}
 */
function createLineChart(canvas, label, borderColor, maxPoints) {
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { display: false } }
    }
  });

  /**
   * Adiciona um novo valor ao gráfico e descarta o ponto mais antigo se exceder maxPoints.
   * @param {number} value
   */
  chart.push = value => {
    chart.data.labels.push('');
    chart.data.datasets[0].data.push(value);
    if (chart.data.datasets[0].data.length > maxPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  };

  return chart;
}

/**
 * Inicializa os três gráficos do dashboard: latência, itens e carregamento.
 *
 * @param {object} selectors
 * @param {HTMLCanvasElement} selectors.latencyCanvas    — <canvas id="chart-latencia">
 * @param {HTMLCanvasElement} selectors.itemsCanvas      — <canvas id="chart-itens">
 * @param {HTMLCanvasElement} selectors.loadCanvas       — <canvas id="chart-carregamento">
 * @param {object} [options]
 * @param {number} [options.maxPoints=60]                — pontos mantidos nos gráficos de linha
 *
 * @returns {{
 *   latencyChart: Chart & { push: (value: number) => void },
 *   itemsChart: Chart & { updateItems: (counts: number[]) => void },
 *   loadChart: Chart & { push: (value: number) => void }
 * }}
 */
export function initCharts(
  { latencyCanvas, itemsCanvas, loadCanvas },
  { maxPoints = 60 } = {}
) {
  // Gráfico de latência (linha)
  const latencyChart = createLineChart(
    latencyCanvas,
    'Latência (ms)',
    'lime',
    maxPoints
  );

  // Gráfico de itens (barra)
  const itemsCtx = itemsCanvas.getContext('2d');
  const itemsChart = new Chart(itemsCtx, {
    type: 'bar',
    data: {
      labels: ['VOD', 'IPTV', 'Rádios', 'Webcams'],
      datasets: [{
        label: 'Itens',
        data: [0, 0, 0, 0],
        backgroundColor: ['#e74c3c', '#27ae60', '#f39c12', '#8e44ad']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  /**
   * Atualiza os dados de itens e redesenha o gráfico.
   * @param {number[]} counts — [vod, iptv, radios, webcams]
   */
  itemsChart.updateItems = counts => {
    itemsChart.data.datasets[0].data = counts;
    itemsChart.update();
  };

  // Gráfico de carregamento (linha)
  const loadChart = createLineChart(
    loadCanvas,
    'Tempo de Carregamento (s)',
    '#3498db',
    maxPoints
  );

  return { latencyChart, itemsChart, loadChart };
}
