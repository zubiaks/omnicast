// frontend/js/modules/dashboard/dashboardCharts.js

import Chart from 'chart.js/auto'
import { configManager } from '@modules/config'

/**
 * @typedef {Object} ChartWithPoint
 * @property {function(number): void} addPoint
 * @property {function(): void} destroy
 * @extends {Chart}
 */

/**
 * Cria um gráfico de linha com método addPoint() para empurrar novos valores.
 *
 * @param {HTMLCanvasElement} canvas — elemento canvas para renderizar.
 * @param {string} label           — legenda da série.
 * @param {string} color           — cor da linha (CSS).
 * @param {number} maxPoints       — máximo de pontos a manter.
 * @returns {ChartWithPoint|null} Instância do Chart com addPoint, ou null se inválido.
 */
function createLineChart(canvas, label, color, maxPoints) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.warn('[dashboardCharts] canvas inválido para', label)
    return null
  }

  const ctx = canvas.getContext('2d')
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor: color,
        backgroundColor: 'transparent',
        tension: configManager.get('dashboardLineTension') ?? 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { beginAtZero: true }
      }
    }
  })

  /**
   * Adiciona um ponto ao dataset, removendo o mais antigo se exceder maxPoints.
   * @param {number} value — novo valor de dado.
   */
  chart.addPoint = value => {
    const ds = chart.data.datasets[0]
    chart.data.labels.push('')
    ds.data.push(value)

    if (ds.data.length > maxPoints) {
      chart.data.labels.shift()
      ds.data.shift()
    }

    chart.update('none')
  }

  return chart
}

/**
 * Inicializa os gráficos do dashboard:
 * - Latência (linha)
 * - Itens (barra)
 * - Tempo de Carregamento (linha)
 *
 * @param {Object} selectors
 * @param {HTMLCanvasElement} selectors.latencyCanvas
 * @param {HTMLCanvasElement} selectors.itemsCanvas
 * @param {HTMLCanvasElement} selectors.loadCanvas
 * @param {Object} [opts]
 * @param {number} [opts.maxPoints] — máximo de pontos (config.dashboardMaxPoints).
 * @returns {Object} Instâncias de gráficos:
 *   { latencyChart, itemsChart, loadChart }
 */
export function initCharts(
  { latencyCanvas, itemsCanvas, loadCanvas },
  { maxPoints } = {}
) {
  const cfg = configManager.getAll()
  const pts = Number.isFinite(maxPoints)
    ? maxPoints
    : (Number.isFinite(cfg.dashboardMaxPoints) ? cfg.dashboardMaxPoints : 60)

  const colors = cfg.dashboardColors || {}
  const latencyColor = colors.latency || 'var(--color-latency, #27ae60)'
  const vodColor     = colors.vod     || 'var(--color-vod, #e74c3c)'
  const iptvColor    = colors.iptv    || 'var(--color-iptv, #27ae60)'
  const radioColor   = colors.radio   || 'var(--color-radio, #f39c12)'
  const webcamColor  = colors.webcam  || 'var(--color-webcam, #8e44ad)'
  const loadColor    = colors.load    || 'var(--color-load, #3498db)'

  // Gráfico de Latência
  const latencyChart = createLineChart(
    latencyCanvas,
    'Latência (ms)',
    latencyColor,
    pts
  )

  // Gráfico de Itens (barra)
  let itemsChart = null
  if (itemsCanvas instanceof HTMLCanvasElement) {
    const ctx = itemsCanvas.getContext('2d')
    itemsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['VOD', 'IPTV', 'Rádio', 'Webcam'],
        datasets: [{
          label: 'Itens',
          data: [0, 0, 0, 0],
          backgroundColor: [vodColor, iptvColor, radioColor, webcamColor]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    })

    /**
     * Atualiza os dados de itens e redesenha sem animação.
     * @param {number[]} counts — [vod, iptv, rádio, webcam].
     */
    itemsChart.updateItems = counts => {
      itemsChart.data.datasets[0].data = counts
      itemsChart.update('none')
    }
  } else {
    console.warn('[dashboardCharts] itemsCanvas inválido para gráfico de itens')
  }

  // Gráfico de Tempo de Carregamento
  const loadChart = createLineChart(
    loadCanvas,
    'Tempo de Carregamento (s)',
    loadColor,
    pts
  )

  return { latencyChart, itemsChart, loadChart }
}
