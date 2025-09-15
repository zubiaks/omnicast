// assets/js/modules/dashboardUpdate.js
import Chart from 'chart.js/auto';
import { getStatus } from './statusService.js';
import { tocarSom, addPulse } from './alerts.js';
import { dataService } from './dataService.js';

/**
 * Inicializa o fetch, métricas e gráficos do dashboard.
 *
 * @param {Object} config
 * @param {string} config.apiBase           — URL base da API
 * @param {number} config.latenciaThreshold — limiar em ms para alerta
 * @param {number} config.updateIntervalMs  — intervalo de auto‐refresh em ms
 * @param {number} [config.maxChartPoints=60] — pontos mantidos nos gráficos
 * @param {boolean} [config.autoRefresh=false] — se deve iniciar auto‐refresh
 * @param {Object} selectors
 * @param {HTMLElement} selectors.timeEl
 * @param {HTMLElement} selectors.metricBackendEl
 * @param {HTMLElement} selectors.metricNetworkEl
 * @param {HTMLElement} selectors.metricSystemEl
 * @param {HTMLElement} selectors.metricContentEl
 * @param {HTMLElement} selectors.highlightsListEl
 * @param {HTMLCanvasElement} selectors.chartLatencyEl
 * @param {HTMLCanvasElement} selectors.chartItemsEl
 * @param {HTMLCanvasElement} selectors.chartLoadEl
 *
 * @returns {{ updateDashboard: Function, startAutoRefresh: Function, stopAutoRefresh: Function }}
 */
export function initializeUpdater(config, selectors) {
  const {
    apiBase,
    latenciaThreshold: latThreshold,
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
    highlightsListEl,
    chartLatencyEl,
    chartItemsEl,
    chartLoadEl
  } = selectors;

  let prevCounts = null;
  let intervalId = null;

  // Helper para atualizar qualquer chart
  function pushToChart(chart, value) {
    chart.data.labels.push('');
    chart.data.datasets[0].data.push(value);
    if (chart.data.datasets[0].data.length > maxChartPoints) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }

  // 1) Inicializa gráficos
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
    data: { labels: [], datasets: [{ label: 'Carregamento (s)', data: [], borderColor: '#3498db', tension: 0.3 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
  });

  // 2) Função principal de atualização
  async function updateDashboard() {
    // 2.1 Hora atual
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString();
    }

    // 2.2 Requisição de status e latência
    const t0 = performance.now();
    const { statusData, latency } = await getStatus(apiBase, { timeout: 7000 });
    const data = statusData ?? await dataService.loadStatusFallback();

    // 2.3 Métrica do Backend
    if (metricBackendEl) {
      const online = statusData !== null;
      metricBackendEl.innerHTML = `
        <h3>Backend</h3>
        Status: ${online ? '🟢 Online' : '🔴 Offline'}<br>
        Latência: ${latency} ms<br>
        Última: ${data?.generated_at
          ? new Date(data.generated_at).toLocaleTimeString()
          : '-'}
      `;
      metricBackendEl.classList.toggle('alerta', !online || latency > latThreshold);
      if (!online) {
        tocarSom('critical', config);
      } else if (latency > latThreshold) {
        tocarSom('warning', config);
      }
    }

    // 2.4 Métricas de Rede e Sistema (pode vir do dataService)
    if (metricNetworkEl) {
      const net = dataService.getNetworkMetrics?.() || { down: '—', up: '—' };
      metricNetworkEl.innerHTML = `<h3>Rede</h3>Down: ${net.down} Mbps<br>Up: ${net.up} Mbps`;
    }
    if (metricSystemEl) {
      const sys = dataService.getSystemMetrics?.() || { cpu: '—', mem: '—' };
      metricSystemEl.innerHTML = `<h3>Sistema</h3>CPU: ${sys.cpu}%<br>RAM: ${sys.mem} GB`;
    }

    // 2.5 Conteúdos e gráfico de itens
    const counts = {
      vod:     (data.vod || []).length,
      iptv:    (data.iptv || []).length,
      radios:  (data.radios || []).length,
      webcams: (data.webcams || []).length
    };
    if (metricContentEl) {
      metricContentEl.innerHTML = `
        <h3>Conteúdos</h3>
        VOD: ${counts.vod}<br>
        IPTV: ${counts.iptv}<br>
        Rádios: ${counts.radios}<br>
        Webcams: ${counts.webcams}
      `;
      // Alertar se novos itens
      if (prevCounts) {
        const hasNew = Object.keys(counts).some(k => counts[k] > prevCounts[k]);
        if (hasNew) {
          tocarSom('info', config);
          addPulse(metricContentEl);
        }
      }
      prevCounts = counts;
    }
    // Atualiza gráfico de barras
    itemsChart.data.datasets[0].data = [
      counts.vod, counts.iptv, counts.radios, counts.webcams
    ];
    itemsChart.update();

    // 2.6 Lista de destaques
    if (highlightsListEl) {
      const top = (data.vod || []).slice(0, 5);
      const frag = document.createDocumentFragment();
      top.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = `🎬 ${item.nome || item.title || '—'}`;
        frag.appendChild(div);
      });
      highlightsListEl.innerHTML = '';
      highlightsListEl.appendChild(frag);
    }

    // 2.7 Gráficos de latência e carregamento
    pushToChart(latencyChart, latency);

    const loadSec = ((performance.now() - t0) / 1000).toFixed(2);
    pushToChart(loadChart, Number(loadSec));
  }

  // 3) Controle de auto‐refresh
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
  if (autoRefresh) {
    startAutoRefresh();
  }

  return { updateDashboard, startAutoRefresh, stopAutoRefresh };
}
