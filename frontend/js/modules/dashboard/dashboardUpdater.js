// frontend/js/modules/dashboard/dashboardUpdater.js

import { getStatus }             from '@modules/network/statusService'
import { getNetworkMetrics, getSystemMetrics } from '@modules/network/metricsService'
import { showToast }             from '@modules/ui/alerts'
import { tocarSom }              from '@modules/ui/sounds'
import { addPulse }              from '@modules/ui/animations'
import { initCharts }            from '@modules/dashboard/dashboardCharts'
import { configManager }         from '@modules/config'

/**
 * Inicializa o ciclo de atualização de métricas e gráficos do dashboard.
 *
 * @param {Object} selectors
 * @param {HTMLElement} selectors.timeEl
 * @param {HTMLElement} selectors.metricBackendEl
 * @param {HTMLElement} selectors.metricNetworkEl
 * @param {HTMLElement} selectors.metricSystemEl
 * @param {HTMLElement} selectors.metricContentEl
 * @param {HTMLElement} selectors.highlightsEl
 * @param {HTMLElement} selectors.btnRefresh
 * @param {HTMLCanvasElement} selectors.chartLatencyEl
 * @param {HTMLCanvasElement} selectors.chartItemsEl
 * @param {HTMLCanvasElement} selectors.chartLoadEl
 *
 * @param {Object} opts
 * @param {string} opts.apiBase             — URL base da API.
 * @param {number} [opts.latencyThreshold]  — ms para alerta de latência.
 * @param {number} [opts.updateIntervalMs]  — intervalo de auto‐refresh em ms.
 * @param {number} [opts.maxChartPoints=60] — máximo de pontos nos gráficos.
 * @param {boolean} [opts.autoRefresh=false]— iniciar polling automático.
 *
 * @returns {{
 *   update: () => Promise<void>,
 *   start: () => void,
 *   stop: () => void,
 *   cleanup: () => void
 * }}
 */
export function initDashboardUpdater(
  {
    timeEl,
    metricBackendEl,
    metricNetworkEl,
    metricSystemEl,
    metricContentEl,
    highlightsEl,
    btnRefresh,
    chartLatencyEl,
    chartItemsEl,
    chartLoadEl
  },
  {
    apiBase,
    latencyThreshold,
    updateIntervalMs,
    maxChartPoints = 60,
    autoRefresh = false
  }
) {
  // Carrega configurações globais
  const cfg = configManager.getAll()

  // Overwrites de opts com config, se não enviados
  const threshold    = Number.isFinite(latencyThreshold)
    ? latencyThreshold
    : (Number.isFinite(cfg.dashboardLatencyThresholdMs)
      ? cfg.dashboardLatencyThresholdMs
      : 200)
  const intervalMs   = Number.isFinite(updateIntervalMs)
    ? updateIntervalMs
    : (Number.isFinite(cfg.dashboardUpdateIntervalMs)
      ? cfg.dashboardUpdateIntervalMs
      : 10000)
  const maxPoints    = Number.isFinite(maxChartPoints)
    ? maxChartPoints
    : (Number.isFinite(cfg.dashboardMaxPoints)
      ? cfg.dashboardMaxPoints
      : 60)

  // Inicializa gráficos
  const { latencyChart, itemsChart, loadChart } = initCharts(
    {
      latencyCanvas: chartLatencyEl,
      itemsCanvas:   chartItemsEl,
      loadCanvas:    chartLoadEl
    },
    { maxPoints }
  )

  // Armazena contagens anteriores para detecção de novos itens
  let prevCounts = { vod: 0, iptv: 0, radio: 0, webcam: 0 }
  let timerId = null

  /**
   * Busca dados, atualiza métricas no DOM e empurra pontos nos charts.
   */
  async function update() {
    const startTime = performance.now()
    let statusData = null
    let latency = 0

    // 1) Obtém status e latência
    try {
      const res = await getStatus(apiBase)
      statusData = res.statusData
      latency = res.latency
    } catch (err) {
      latency = Math.round(performance.now() - startTime)
      console.warn('[dashboardUpdater] getStatus falhou', err)
    }

    // 2) Atualiza timestamp
    if (timeEl) {
      timeEl.textContent = new Date().toLocaleTimeString()
    }

    // 3) Backend
    if (metricBackendEl) {
      const online = Boolean(statusData)
      const genAt = statusData?.generatedAt
        ? new Date(statusData.generatedAt).toLocaleTimeString()
        : '—'
      metricBackendEl.innerHTML = `
        <h3>Backend</h3>
        Status: ${online ? '🟢 Online' : '🔴 Offline'}<br>
        Latência: ${latency} ms<br>
        Última Geração: ${genAt}
      `
      const alert = !online || latency > threshold
      metricBackendEl.classList.toggle('alerta', alert)
      if (!online) {
        tocarSom('critical')
      } else if (latency > threshold) {
        tocarSom('warning')
      }
    }

    // 4) Rede
    if (metricNetworkEl) {
      const net = getNetworkMetrics() || { down: '—', up: '—' }
      metricNetworkEl.innerHTML = `
        <h3>Rede</h3>
        Down: ${net.down} Mbps<br>
        Up: ${net.up} Mbps
      `
    }

    // 5) Sistema
    if (metricSystemEl) {
      const sys = getSystemMetrics() || { cpu: '—', mem: '—' }
      metricSystemEl.innerHTML = `
        <h3>Sistema</h3>
        CPU: ${sys.cpu}%<br>
        RAM: ${sys.mem} GB
      `
    }

    // 6) Conteúdos e destaques
    const counts = {
      vod:    statusData?.vod?.length    || 0,
      iptv:   statusData?.iptv?.length   || 0,
      radio:  statusData?.radio?.length  || 0,
      webcam: statusData?.webcam?.length || 0
    }

    if (metricContentEl) {
      metricContentEl.innerHTML = `
        <h3>Conteúdos</h3>
        VOD: ${counts.vod}<br>
        IPTV: ${counts.iptv}<br>
        Rádios: ${counts.radio}<br>
        Webcams: ${counts.webcam}
      `
      // Animação se houver novos itens
      const hasNew = Object.keys(counts)
        .some(k => counts[k] > (prevCounts[k] || 0))
      if (hasNew) {
        tocarSom('info')
        addPulse(metricContentEl)
      }
      prevCounts = counts
    }

    // 7) Destaques
    if (highlightsEl) {
      highlightsEl.innerHTML = statusData?.vod
        ?.slice(0, 5)
        .map(item => `<div class="item">🎬 ${item.title || item.nome || '—'}</div>`)
        .join('') || ''
    }

    // 8) Atualiza gráficos
    itemsChart?.updateItems([
      counts.vod,
      counts.iptv,
      counts.radio,
      counts.webcam
    ])
    latencyChart?.addPoint(latency)
    const loadSec = ((performance.now() - startTime) / 1000).toFixed(2)
    loadChart?.addPoint(Number(loadSec))
  }

  /**
   * Inicia o ciclo de auto‐refresh.
   */
  function start() {
    stop()
    timerId = setInterval(update, intervalMs)
  }

  /**
   * Para o ciclo de auto‐refresh.
   */
  function stop() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  // Bind no botão de refresh manual
  btnRefresh?.addEventListener('click', update)

  // Inicia auto‐refresh se configurado
  if (autoRefresh) {
    start()
  }

  /**
   * Remove listeners e timers.
   */
  function cleanup() {
    stop()
    btnRefresh?.removeEventListener('click', update)
  }

  return { update, start, stop, cleanup }
}
