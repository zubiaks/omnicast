// frontend/js/modules/dashboard/dashboardController.js

import { configManager, CONFIG_CHANGE_EVENT } from '@modules/config'
import { initCharts }                       from '@modules/dashboard/dashboardCharts'
import { formatMetrics }                    from '@modules/utils/formatters'
import { showToast }                        from '@modules/ui/alerts'
import { eventBus }                         from '@modules/utils'

/**
 * Controlador principal do dashboard:
 * atualiza métricas, preenche gráficos, gerencia tabs e auto‐refresh.
 *
 * @param {Object} selectors
 * @param {NodeList<HTMLElement>} selectors.tabs         — elementos [data-tab]
 * @param {NodeList<HTMLElement>} selectors.panels       — containers [data-panel]
 * @param {HTMLElement} selectors.timeEl                 — exibe hora da última atualização
 * @param {HTMLElement} selectors.backendEl              
 * @param {HTMLElement} selectors.networkEl              
 * @param {HTMLElement} selectors.systemEl               
 * @param {HTMLElement} selectors.contentEl              
 * @param {HTMLElement} selectors.highlightsEl           
 * @param {HTMLElement} selectors.btnRefresh             
 * @param {HTMLElement} selectors.btnConfigOpen          
 * @param {HTMLElement} selectors.panelConfig           
 * @param {HTMLCanvasElement} selectors.latencyCanvas    
 * @param {HTMLCanvasElement} selectors.itemsCanvas      
 * @param {HTMLCanvasElement} selectors.loadCanvas       
 * @param {string} [pollingIntervalKey='statusPollingMs'] — chave em config p/ intervalo
 * @returns {Object}  
 * @returns {Function} return.fetchAndRender — dispara uma atualização manual  
 * @returns {Function} return.startAuto       — inicia polling automático  
 * @returns {Function} return.stopAuto        — para o polling  
 * @returns {Function} return.cleanup         — remove listeners e timers  
 */
export function initDashboard(
  {
    tabs, panels,
    timeEl, backendEl, networkEl, systemEl,
    contentEl, highlightsEl,
    btnRefresh, btnConfigOpen, panelConfig,
    latencyCanvas, itemsCanvas, loadCanvas
  },
  pollingIntervalKey = 'statusPollingMs'
) {
  // configurações
  const cfg = configManager.getAll()

  // inicializa gráficos
  const maxPoints = Number.isFinite(cfg.dashboardMaxPoints)
    ? cfg.dashboardMaxPoints
    : 60
  const { latencyChart, itemsChart, loadChart } = initCharts(
    { latencyCanvas, itemsCanvas, loadCanvas },
    { maxPoints }
  )

  // busca e renderiza métricas no DOM
  async function fetchAndRender() {
    try {
      const res  = await fetch('/api/metrics', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      timeEl.textContent       = new Date().toLocaleTimeString()
      backendEl.textContent    = formatMetrics(data.backend)
      networkEl.textContent    = formatMetrics(data.network)
      systemEl.textContent     = formatMetrics(data.system)
      contentEl.textContent    = formatMetrics(data.content)
      highlightsEl.innerHTML   = data.highlights.map(h => `<li>${h}</li>`).join('')

      latencyChart?.addPoint(data.latency)
      itemsChart?.updateItems([
        data.counts.vod,
        data.counts.iptv,
        data.counts.radio,
        data.counts.webcam
      ])
      loadChart?.addPoint(data.loadTime)
    } catch (err) {
      console.error('[dashboardController] fetchAndRender:', err)
      showToast('Erro ao atualizar dashboard.', { type: 'critical' })
    }
  }

  // gerencia polling automático
  let timerId = null
  function startAuto() {
    stopAuto()
    const interval = Number.isFinite(cfg[pollingIntervalKey])
      ? cfg[pollingIntervalKey]
      : 10000
    timerId = setInterval(fetchAndRender, interval)
  }
  function stopAuto() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  // controla tabs e painéis
  function initTabs() {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === 0)
      tab.addEventListener('click', () => {
        panels.forEach((p, idx) => p.hidden = idx !== i)
        tabs.forEach(t => t.setAttribute('aria-selected', t === tab))
      })
    })
    panels.forEach((p, i) => p.hidden = i !== 0)
  }

  // registra listeners e eventBus
  const listeners = []
  function on(el, event, handler) {
    if (!el) return
    el.addEventListener(event, handler)
    listeners.push({ el, event, handler })
  }

  // UI events
  on(btnRefresh, 'click', fetchAndRender)
  on(btnConfigOpen, 'click', () => panelConfig.classList.toggle('show'))

  // reage a mudanças de configuração em tempo real
  const onConfigChange = ({ key, value }) => {
    if (key === 'autoRefresh') {
      value ? startAuto() : stopAuto()
    }
    if (key === pollingIntervalKey && cfg.autoRefresh) {
      startAuto()
    }
  }
  eventBus.on(CONFIG_CHANGE_EVENT, onConfigChange)

  // inicializações
  initTabs()
  fetchAndRender()
  if (cfg.autoRefresh) startAuto()

  // retorno com API e cleanup
  return {
    fetchAndRender,
    startAuto,
    stopAuto,
    cleanup: () => {
      stopAuto()
      listeners.forEach(({ el, event, handler }) => {
        el.removeEventListener(event, handler)
      })
      eventBus.off(CONFIG_CHANGE_EVENT, onConfigChange)
    }
  }
}
