// frontend/js/modules/dashboard/dashboardCycle.js

import { configManager, CONFIG_CHANGE_EVENT } from '@modules/config'
import { eventBus }                          from '@modules/utils'

/** Chave em config para intervalo de troca de painéis */
export const PANEL_CYCLE_INTERVAL_KEY = 'panelCycleIntervalMs'

/** Evento emitido quando o painel ativo muda */
export const PANEL_CYCLE_EVENT = 'panelCycle:changed'

let cycleIntervalId = null

/**
 * Listener de mudança de configuração que reinicia o ciclo
 * se alterar o intervalo de painéis.
 *
 * @param {{ key: string, value: any }} payload
 */
function onConfigChange({ key, value }) {
  if (key !== PANEL_CYCLE_INTERVAL_KEY) return
  if (cycleIntervalId !== null) {
    stopPanelCycle()
    startPanelCycle()
  }
}

/**
 * Inicia o ciclo automático de painéis.
 *
 * @param {HTMLElement[]|NodeList<HTMLElement>} [panels]
 *   Coleção de painéis. Se omitido, usa todos em root.querySelectorAll(panelSelector).
 * @param {Object} [opts]
 * @param {number} [opts.intervalMs]
 *   Intervalo em ms para troca (override de config).
 * @param {string} [opts.panelSelector='.painel']
 *   Se não informar panels, usa este seletor para encontrá-los.
 * @param {Document|HTMLElement} [opts.root=document]
 *   Raiz para querySelectorAll.
 * @returns {() => void}
 *   Função para parar o ciclo (cleanup).
 */
export function startPanelCycle(
  panels,
  { intervalMs, panelSelector = '.painel', root = document } = {}
) {
  // monta array de painéis
  const panelList = panels
    ? Array.from(panels)
    : Array.from(root.querySelectorAll(panelSelector))

  if (panelList.length < 2) {
    console.warn('[dashboardCycle] é necessário pelo menos 2 painéis')
    return stopPanelCycle
  }

  // define intervalo a usar
  const cfg      = configManager.getAll()
  const interval = Number.isFinite(intervalMs)
    ? intervalMs
    : (Number.isFinite(cfg[PANEL_CYCLE_INTERVAL_KEY])
      ? cfg[PANEL_CYCLE_INTERVAL_KEY]
      : 10000)

  let currentIndex = 0

  // ativa painel por índice e emite evento
  function activate(idx) {
    panelList.forEach((panel, i) => {
      const isActive = i === idx
      panel.classList.toggle('ativo', isActive)
      panel.setAttribute('aria-hidden', String(!isActive))
    })
    currentIndex = idx
    eventBus.emit(PANEL_CYCLE_EVENT, { index: idx })
  }

  // ativa primeiro e inicia interval
  activate(0)
  cycleIntervalId = setInterval(() => {
    const next = (currentIndex + 1) % panelList.length
    activate(next)
  }, interval)

  // escuta mudanças de config
  eventBus.on(CONFIG_CHANGE_EVENT, onConfigChange)

  return stopPanelCycle
}

/**
 * Para o ciclo de painéis e remove listener de configuração.
 */
export function stopPanelCycle() {
  if (cycleIntervalId !== null) {
    clearInterval(cycleIntervalId)
    cycleIntervalId = null
    eventBus.off(CONFIG_CHANGE_EVENT, onConfigChange)
  }
}
