// assets/js/modules/dashboardUpdate.js

import Chart from 'chart.js/auto';
import { playAlertSound, pulseElement } from './alerts.js';

/**
 * Inicializa a lógica de fetch, métricas e gráficos.
 * @param {Object} config          — Configuração carregada (loadConfig).
 * @param {Object} selectors       — Coleção de elementos DOM:
 *    { timeEl, metricBackend, metricRede, metricSistema,
 *      metricConteudos, listaDestaques,
 *      chartLatenciaEl, chartItensEl, chartCarregamentoEl }
 * @returns {Object} updaterControls — { updateDashboard, startAutoRefresh, stopAutoRefresh }
 */
export function initializeUpdater(config, selectors) {
  const {
    timeEl, metricBackend, metricRede, metricSistema,
    metricConteudos, listaDestaques,
    chartLatenciaEl, chartItensEl, chartCarregamentoEl
  } = selectors;

  const apiBase       = config.apiBase;
  const latThreshold  = config.latenciaThreshold;
  const updateMs      = config.updateIntervalMs;

  let prevCounts      = null;
  let refreshInterval = null;

  // 1) Inicializar gráficos
  const chartLat = new Chart(chartLatenciaEl, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Latência (ms)', data: [], borderColor: 'lime', tension: 0.25 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
  });
  const chartIt  = new Chart(chartItensEl, {
    type: 'bar',
    data: { labels: ['VOD','IPTV','Rádios','Webcams'], datasets: [{ label: 'Itens', data: [0,0,0,0], backgroundColor: ['#e74c3c','#27ae60','#f39c12','#8e44ad'] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  const chartCar= new Chart(chartCarregamentoEl, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Carregamento (s)', data: [], borderColor: '#3498db', tension: 0.25 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
  });

  // 2) Função principal de atualização
  async function updateDashboard() {
    // 2.1 Atualizar relógio
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();

    const t0 = performance.now();
    let data = null, latency = 0;

    try {
      const res = await fetch(`${apiBase}/status`, { cache: 'no-store' });
      latency = Math.round(performance.now() - t0);
      if (res.ok) data = await res.json();
    } catch {}

    // 2.2 Atualizar métricas backend
    metricBackend.innerHTML = `
      <h3>Backend</h3>
      Status: ${data ? '🟢 Online' : '🔴 Offline'}<br>
      Latência: ${latency} ms<br>
      Última: ${data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : '-'}
    `;
    // 2.3 Métricas fixas de rede e sistema
    metricRede.innerHTML    = `<h3>Rede</h3>Ligação: 🟢<br>Down: 50 Mbps<br>Up: 10 Mbps`;
    metricSistema.innerHTML = `<h3>Sistema</h3>CPU: 35%<br>Memória: 2.1 GB`;

    // 2.4 Conteúdos e gráficos de itens
    if (data) {
      const counts = {
        vod:     data.vod?.length || 0,
        iptv:    data.iptv?.length || 0,
        radios:  data.radios?.length || 0,
        webcams: data.webcams?.length || 0
      };
      metricConteudos.innerHTML = `
        <h3>Conteúdos</h3>
        VOD: ${counts.vod}<br>
        IPTV: ${counts.iptv}<br>
        Rádios: ${counts.radios}<br>
        Webcams: ${counts.webcams}
      `;
      // atualizar gráfico de itens
      chartIt.data.datasets[0].data = [counts.vod, counts.iptv, counts.radios, counts.webcams];
      chartIt.update();

      // atualiza lista de destaques
      listaDestaques.innerHTML = data.vod.slice(0,5)
        .map(item => `<div class="item">🎬 ${item?.nome||item?.title||'Item'}</div>`)
        .join('');

      // detectar novos conteúdos
      if (prevCounts) {
        const hasNew = Object.keys(counts).some(k => counts[k] > prevCounts[k]);
        if (hasNew) {
          playAlertSound('info', config);
          pulseElement(metricConteudos);
        }
      }
      prevCounts = counts;
    }

    // 2.5 Atualizar gráfico de latência
    chartLat.data.labels.push('');
    chartLat.data.datasets[0].data.push(latency);
    if (chartLat.data.datasets[0].data.length > 60) {
      chartLat.data.labels.shift();
      chartLat.data.datasets[0].data.shift();
    }
    chartLat.update();

    // 2.6 Atualizar gráfico de carregamento
    const loadTime = +(performance.now()/1000).toFixed(2);
    chartCar.data.labels.push('');
    chartCar.data.datasets[0].data.push(loadTime);
    if (chartCar.data.datasets[0].data.length > 60) {
      chartCar.data.labels.shift();
      chartCar.data.datasets[0].data.shift();
    }
    chartCar.update();

    // 2.7 Alertas de latência
    if (!data) {
      metricBackend.classList.add('alerta');
      playAlertSound('critical', config);
    } else if (latency > latThreshold) {
      metricBackend.classList.add('alerta');
      playAlertSound('warning', config);
    } else {
      metricBackend.classList.remove('alerta');
    }
  }

  // 3) Controlo de refresh automático
  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(updateDashboard, updateMs);
  }
  function stopAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = null;
  }

  // 4) Primeira chamada e auto-refresh condicional
  updateDashboard();
  if (config.autoRefresh) startAutoRefresh();

  return { updateDashboard, startAutoRefresh, stopAutoRefresh };
}
