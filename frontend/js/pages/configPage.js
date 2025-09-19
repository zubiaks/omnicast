// frontend/js/pages/configPage.js

import { initTheme }                 from '@modules/ui/themeManager.js'
import { initDisplaySettings }       from '@modules/ui/displaySettings.js'
import { initUiControls }            from '@modules/ui/uiControls.js'
import { showToast }                 from '@modules/ui/alerts.js'
import { initPwaUpdater }            from '@modules/network/pwaUpdater.js'
import { configManager }             from '@modules/config/configManager.js'

/**
 * Inicializa a página de configurações:
 * • Tema
 * • Auto-refresh
 * • Intervalo de refresh da dashboard
 *
 * @param {Object} [opts]
 * @param {string} [opts.formSelector='#config-form']
 * @param {string} [opts.temaSelector='[name="config-tema"]']
 * @param {string} [opts.autoRefreshSelector='[name="config-autorefresh"]']
 * @param {string} [opts.intervalSelector='[name="config-refresh-interval"]']
 */
function initConfigPage({
  formSelector        = '#config-form',
  temaSelector        = '[name="config-tema"]',
  autoRefreshSelector = '[name="config-autorefresh"]',
  intervalSelector    = '[name="config-refresh-interval"]'
} = {}) {
  const formEl     = document.querySelector(formSelector)
  if (!formEl) {
    console.warn('[configPage] formulário não encontrado:', formSelector)
    return
  }

  const temaEl     = formEl.querySelector(temaSelector)
  const autoEl     = formEl.querySelector(autoRefreshSelector)
  const intervalEl = formEl.querySelector(intervalSelector)

  if (!temaEl || !autoEl || !intervalEl) {
    console.warn('[configPage] campos de configuração não encontrados.')
    return
  }

  // Valores iniciais vindos da config
  const cfg = configManager.loadConfig()
  temaEl.checked   = cfg.tema === 'dark'
  autoEl.checked   = Boolean(cfg.autoRefresh)
  intervalEl.value = cfg.refreshIntervalMs ?? ''

  // Feedback visual nos campos
  function flash(el, cls) {
    el.classList.add(cls)
    setTimeout(() => el.classList.remove(cls), 800)
  }

  // Atualiza config e dá feedback via toast
  function onFieldChange(key, value, el) {
    try {
      configManager.updateConfig(key, value)
      flash(el, 'field-saved')
      showToast('Configuração salva', { type: 'info' })
    } catch {
      flash(el, 'field-error')
      showToast('Erro ao salvar configuração', { type: 'critical' })
    }
  }

  // Listeners dos campos
  temaEl.addEventListener('change', () => {
    const tema = temaEl.checked ? 'dark' : 'light'
    onFieldChange('tema', tema, temaEl)
  })

  autoEl.addEventListener('change', () => {
    onFieldChange('autoRefresh', autoEl.checked, autoEl)
  })

  intervalEl.addEventListener('change', () => {
    const ms = Number(intervalEl.value)
    if (!Number.isFinite(ms) || ms < 1000) {
      showToast('Intervalo inválido', { type: 'warning' })
      intervalEl.value = configManager.loadConfig().refreshIntervalMs ?? ''
      return
    }
    onFieldChange('refreshIntervalMs', ms, intervalEl)
  })
}

// Auto-bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initTheme()
  initDisplaySettings()

  const { updateAlert } = configManager.loadConfig()
  initPwaUpdater({ updateAlert })

  initUiControls()

  if (document.querySelector('#config-form')) {
    initConfigPage()
  }
})
