// frontend/js/modules/config/configUI.js

import {
  loadConfig,
  updateConfig,
  resetConfig,
  resetConfigKey,
  CONFIG_CHANGE_EVENT,
  CONFIG_RESET_EVENT
} from '@modules/config/configManager.js'
import { applyTheme }  from '@modules/ui/themeManager.js'
import { showToast }   from '@modules/ui/alerts.js'
import { eventBus }    from '@modules/utils/eventBus.js'

/**
 * Inicializa a interface de configurações.
 * 
 * @param {Document|HTMLElement} [root=document]
 *   Raiz do DOM onde estão os inputs data-config.
 */
export function initConfigUI(root = document) {
  // Aplica o tema atual
  const cfg = loadConfig()
  applyTheme(cfg.tema)

  // Atualiza um único input a partir da config
  function updateInput(input) {
    const key = input.dataset.config
    let value = loadConfig()[key]

    if (input.type === 'checkbox') {
      input.checked = Boolean(value)
    } else if (input.type === 'number') {
      input.value = Number(value)
    } else {
      input.value = value ?? ''
    }

    if (key === 'tema') {
      applyTheme(value)
    }
  }

  // Preenche todos os inputs data-config e data-config-son
  function updateAll() {
    root.querySelectorAll('[data-config]').forEach(updateInput)

    const sons = loadConfig().sonsAtivos || {}
    root.querySelectorAll('[data-config-son]').forEach(input => {
      const sk = input.dataset.configSon
      input.checked = Boolean(sons[sk])
    })
  }

  // Escuta mudanças disparadas externamente
  eventBus.on(CONFIG_CHANGE_EVENT, ({ detail: { key } }) => {
    root.querySelectorAll(`[data-config="${key}"]`).forEach(updateInput)
    showToast('Configuração atualizada', { type: 'info' })
  })

  eventBus.on(CONFIG_RESET_EVENT, () => {
    updateAll()
    showToast('Configurações resetadas', { type: 'info' })
  })

  // Inicial fill
  updateAll()

  // Helper para bind de change
  function bindConfig(selector, handler) {
    root.querySelectorAll(selector).forEach(el =>
      el.addEventListener('change', () => handler(el))
    )
  }

  // Quando qualquer input data-config muda
  bindConfig('[data-config]', el => {
    const key   = el.dataset.config
    let value   = el.type === 'checkbox'
      ? el.checked
      : el.type === 'number'
        ? Number(el.value)
        : el.value

    updateConfig(key, value)
  })

  // Quando toggle de sons ativos muda
  bindConfig('[data-config-son]', el => {
    const sk      = el.dataset.configSon
    const current = loadConfig().sonsAtivos || {}
    const updated = { ...current, [sk]: el.checked }
    updateConfig('sonsAtivos', updated)
  })

  // Botão “Resetar tudo”
  const btnResetAll = root.getElementById('btn-reset-config')
  btnResetAll?.addEventListener('click', () => {
    if (confirm('Repor todas as configurações para o padrão?')) {
      resetConfig()
    }
  })

  // Botões “Resetar chave específica”
  bindConfig('[data-reset-key]', btn => {
    const key = btn.dataset.resetKey
    resetConfigKey(key)
  })
}
