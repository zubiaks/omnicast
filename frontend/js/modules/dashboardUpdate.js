// assets/js/modules/dashboardUpdate.js
import Chart from 'chart.js/auto';
import { fetchStatus } from './dataService.js';
import { playAlertSound, pulseElement } from './alerts.js';

/**
 * Inicializa o dashboard: relógio, métricas e gráficos, com auto‐refresh opcional.
 *
 * @param {Object} config
 * @param {string} config.apiBase           — URL base da API
 * @param {number} config.latenciaThreshold — limiar (ms) para alerta de latência
 * @param {number} config.updateIntervalMs  — intervalo (ms) de auto‐refresh
 * @param {number} [config.maxChartPoints=60] — quantos pontos manter nos gráficos
 * @param {boolean} [config.autoRefresh=false] — se inicia auto‐refresh
 *
 * @param {Object} selectors
 * @param {HTMLElement} selectors.timeEl
 * @param {HTMLElement} selectors.metricBackendEl
 * @param {HTMLElement} selectors.metricNetworkEl
 * @param {HTMLElement} selectors.metricSystemEl
 * @param {HTMLElement} selectors.metricContentEl
 * @param {HTMLElement} selectors.highlightsEl
 * @param {HTMLCanvasElement} selectors.chartLatencyEl
 * @param {HTMLCanvasElement} selectors.chartItemsEl
 * @param {HTMLCanvasElement} selectors.chartLoadEl
 *
 * @returns {{ updateDashboard: Function, startAutoRefresh: Function, stopAutoRefresh: Function }}
 */
export function initializeUpdater(config, selectors) {
  const {
    apiBase,
    latenciaThreshold,
    updateIntervalMs,
    maxChartPoints = 60,
    autoRefresh = false
  } = config;

  const {
    timeEl,
    metricBackendEl,
    metricNetworkEl,
    metricSystemEl,
    metricContentEl,
    highlightsEl,
    chartLatencyEl,
    chartItemsEl,
    chartLoadEl
  } = selectors;

  let prevCounts = null;
  let intervalId = null;

  // Helper para empurrar valor em gráfico de linha
  function pushToChart(chart, value) {
    chart.data.labels.push('');
    chart.data.datasets[0].data.push(value);
    if (chart.data.datasets[0].data.length > maxChartPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }

  // 1) Configura gráficos
  const latencyChart = new Chart(chartLatencyEl, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Latência (ms)', data: [], borderColor: 'lime', tension: 0.3 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
  });

  const itemsChart = new Chart(chartItemsEl, {
    type: 'bar',
    data: {
      labels: ['VOD', 'IPTV', 'Rádios', 'Webcams'],
      datasets: [{
        label: 'Itens',
        data: [0, 0, 0, 0],
        backgroundColor: ['#e74c3c', '#27ae60', '#f39c12', '#8e44ad']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const loadChart = new Chart(chartLoadEl, {
    type: 'line',
    data: [{ labels: [], datasets: [{ label: 'Carregamento (s)', data: [], borderColor: '#3498db', tension: 0.3 }] }][0],
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
  });

  // 2) Função de atualização
  async function updateDashboard() {
    // 2.1 Horário
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString();
    }

    // 2.2 Fetch de status
    const t0 = performance.now();
    let statusData = null;
    let latency = 0;

    try {
      const result = await fetchStatus(apiBase);
      statusData = result.statusData;
      latency = result.latency;
    } catch {
      latency = Math.round(performance.now() - t0);
    }

    // 2.3 Backend
    if (metricBackendEl) {
      const online = statusData !== null;
      metricBackendEl.innerHTML = `
        <h3>Backend</h3>
        Status: ${online ? '🟢 Online' : '🔴 Offline'}<br>
        Latência: ${latency} ms<br>
        Última: ${statusData?.generated_at
          ? new Date(statusData.generated_at).toLocaleTimeString()
          : '-'}
      `;
      metricBackendEl.classList.toggle('alerta', !online || latency > latenciaThreshold);

      if (!online) {
        playAlertSound('critical', config);
      } else if (latency > latenciaThreshold) {
        playAlertSound('warning', config);
      }
    }

    // 2.4 Rede e Sistema (placeholder ou dataService)
    if (metricNetworkEl) {
      metricNetworkEl.innerHTML = `<h3>Rede</h3>Down: 50 Mbps<br>Up: 10 Mbps`;
    }
    if (metricSystemEl) {
      metricSystemEl.innerHTML = `<h3>Sistema</h3>CPU: 35%<br>Memória: 2.1 GB`;
    }

    // 2.5 Conteúdos e gráfico de barras
    const counts = {
      vod:     statusData?.vod?.length || 0,
      iptv:    statusData?.iptv?.length || 0,
      radios:  statusData?.radios?.length || 0,
      webcams: statusData?.webcams?.length || 0
    };

    if (metricContentEl) {
      metricContentEl.innerHTML = `
        <h3>Conteúdos</h3>
        VOD: ${counts.vod}<br>
        IPTV: ${counts.iptv}<br>
        Rádios: ${counts.radios}<br>
        Webcams: ${counts.webcams}
      `;

      if (prevCounts) {
        const hasNew = Object.keys(counts).some(k => counts[k] > prevCounts[k]);
        if (hasNew) {
          playAlertSound('info', config);
          pulseElement(metricContentEl);
        }
      }
      prevCounts = counts;
    }

    itemsChart.data.datasets[0].data = [
      counts.vod, counts.iptv, counts.radios, counts.webcams
    ];
    itemsChart.update();

    // 2.6 Destaques
    if (highlightsEl) {
      const highlights = (statusData?.vod || []).slice(0, 5);
      highlightsEl.innerHTML = highlights
        .map(item => `<div class="item">🎬 ${item.nome || item.title || '—'}</div>`)
        .join('');
    }

    // 2.7 Gráficos de latência e carregamento
    pushToChart(latencyChart, latency);

    const loadSec = ((performance.now() - t0) / 1000).toFixed(2);
    pushToChart(loadChart, Number(loadSec));
  }

  // 3) Auto‐refresh control
  function startAutoRefresh() {
    stopAutoRefresh();
    intervalId = setInterval(updateDashboard, updateIntervalMs);
  }
  function stopAutoRefresh() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // 4) Primeira execução
  updateDashboard();
  if (autoRefresh) startAutoRefresh();

  return { updateDashboard, startAutoRefresh, stopAutoRefresh };
}
