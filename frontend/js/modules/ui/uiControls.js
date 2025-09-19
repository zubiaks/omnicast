// frontend/js/modules/ui/uiControls.js

import { configManager, CONFIG_CHANGE_EVENT } from '@modules/config'
import { applyTheme }                        from '@modules/ui/themeManager'
import { eventBus }                          from '@modules/utils/eventBus'

/**
 * Inicializa controles de UI:
 * - Painel de configurações
 * - Seleção de tema
 * - Toggle de alertas de atualização
 * - Toggle de auto‐refresh
 * - Checkbox de sons
 * - Botão de refresh manual
 *
 * @param {Object} [opts]
 * @param {Object} [opts.selectors] — Seletores CSS customizados:
 *   { btnOpenConfig, panelConfig, btnSaveConfig, btnManualRefresh,
 *     themeRadios, toggleUpdateAlert, toggleAutoRefresh, soundCheckboxes }
 * @param {Object} [opts.updaterControls]
 *   Funções para controle de auto‐refresh:
 *   { updateDashboard: Function, startAutoRefresh: Function, stopAutoRefresh: Function }
 * @param {Document|HTMLElement} [root=document]
 *   Raiz para queries (útil para testes ou Shadow DOM).
 * @returns {() => void} cleanup — remove todos os listeners e sincronizações.
 */
export function initUiControls(
  {
    selectors = {},
    updaterControls = {}
  } = {},
  root = document
) {
  // Seletores padrão
  const defaults = {
    btnOpenConfig:     '[data-ui-open-config]',
    panelConfig:       '[data-ui-panel-config]',
    btnSaveConfig:     '[data-ui-save-config]',
    btnManualRefresh:  '[data-ui-manual-refresh]',
    themeRadios:       '[data-ui-theme]',
    toggleUpdateAlert: '[data-ui-toggle-update-alert]',
    toggleAutoRefresh: '[data-ui-toggle-auto-refresh]',
    soundCheckboxes:   '[data-som]'
  }
  const sel = { ...defaults, ...selectors }

  // References DOM
  const btnOpenConfig    = root.querySelector(sel.btnOpenConfig)
  const panelConfig      = root.querySelector(sel.panelConfig)
  const btnSaveConfig    = root.querySelector(sel.btnSaveConfig)
  const btnManualRefresh = root.querySelector(sel.btnManualRefresh)
  const themeRadios      = Array.from(root.querySelectorAll(sel.themeRadios))
  const toggleUpdateAlert= root.querySelector(sel.toggleUpdateAlert)
  const toggleAutoRefresh= root.querySelector(sel.toggleAutoRefresh)
  const soundCheckboxes  = Array.from(root.querySelectorAll(sel.soundCheckboxes))

  // Updater controls
  const {
    updateDashboard  = () => {},
    startAutoRefresh = () => {},
    stopAutoRefresh  = () => {}
  } = updaterControls

  // Config atual
  const config = configManager.getAll()

  // Coleção de listeners para cleanup
  const listeners = []
  function on(el, evt, fn) {
    el?.addEventListener(evt, fn)
    listeners.push({ el, evt, fn })
  }

  // Sincroniza todos os controles com a config
  function refreshUI() {
    // Tema
    themeRadios.forEach(radio => {
      radio.checked = radio.value === config.tema
    })

    // Alertas de atualização
    if (toggleUpdateAlert) {
      toggleUpdateAlert.checked = Boolean(config.updateAlert)
    }

    // Auto‐refresh
    if (toggleAutoRefresh) {
      toggleAutoRefresh.checked = Boolean(config.autoRefresh)
      btnManualRefresh?.classList.toggle('hidden', config.autoRefresh)
    }

    // Sons ativos
    soundCheckboxes.forEach(cb => {
      const key = cb.dataset.som
      cb.checked = Boolean(config.sonsAtivos?.[key])
    })
  }

  // Atualiza uma única propriedade de config e a UI
  function changeProp(prop, value) {
    if (config[prop] === value) return
    const updated = configManager.updateConfig(prop, value)
    Object.assign(config, updated)
    refreshUI()
  }

  // Bind UI → config
  themeRadios.forEach(radio => {
    on(radio, 'change', e => {
      const next = e.target.value
      applyTheme(next)
      changeProp('tema', next)
    })
  })

  on(toggleUpdateAlert, 'change', e => {
    changeProp('updateAlert', e.target.checked)
  })

  on(toggleAutoRefresh, 'change', e => {
    const enabled = e.target.checked
    changeProp('autoRefresh', enabled)
    enabled ? startAutoRefresh() : stopAutoRefresh()
  })

  soundCheckboxes.forEach(cb => {
    on(cb, 'change', e => {
      const key = e.target.dataset.som
      changeProp('sonsAtivos', {
        ...config.sonsAtivos,
        [key]: e.target.checked
      })
    })
  })

  on(btnOpenConfig, 'click', () => {
    const isHidden = panelConfig?.classList.toggle('hidden')
    if (!isHidden) refreshUI()
  })

  on(btnSaveConfig, 'click', () => {
    panelConfig?.classList.add('hidden')
  })

  on(btnManualRefresh, 'click', () => updateDashboard())

  // Reage a mudanças de config externas
  function onConfigChange({ key, value }) {
    if (key === 'tema') {
      applyTheme(value)
    }
    if (key === 'updateAlert') {
      toggleUpdateAlert && (toggleUpdateAlert.checked = value)
    }
    if (key === 'autoRefresh') {
      toggleAutoRefresh && (toggleAutoRefresh.checked = value)
      btnManualRefresh?.classList.toggle('hidden', value)
    }
    if (key === 'sonsAtivos') {
      Object.entries(value).forEach(([k, v]) => {
        const cb = root.querySelector(`[data-som="${k}"]`)
        if (cb) cb.checked = v
      })
    }
    refreshUI()
  }
  eventBus.on(CONFIG_CHANGE_EVENT, onConfigChange)

  // Inicializa UI
  refreshUI()

  // Retorna cleanup
  return () => {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn))
    eventBus.off(CONFIG_CHANGE_EVENT, onConfigChange)
  }
}
