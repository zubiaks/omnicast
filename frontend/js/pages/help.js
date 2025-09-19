// frontend/js/pages/help.js

import { initTheme }              from '@modules/ui/themeManager.js'
import { initDisplaySettings }    from '@modules/ui/displaySettings.js'
import { initUiControls }         from '@modules/ui/uiControls.js'
import { initPwaUpdater }         from '@modules/network/pwaUpdater.js'
import { configManager }          from '@modules/config/configManager.js'

/**
 * Inicializa a página de ajuda:
 * - Aplica tema e modo de exibição
 * - Exibe banner de atualização PWA
 * - Ativa painel de configurações e controles de UI
 * - Configura toggles para FAQs
 */
export function initHelpPage() {
  // 1) Tema e layout
  initTheme()
  initDisplaySettings()

  // 2) Notificação de atualização PWA
  const { updateAlert } = configManager.loadConfig()
  initPwaUpdater({ updateAlert })

  // 3) Controles de UI (painel de config, som, atalhos)
  initUiControls()

  // 4) Toggles de FAQ
  document
    .querySelectorAll('[data-help-toggle]')
    .forEach(toggleBtn => {
      const targetSelector = toggleBtn.dataset.helpTarget
      const panel = document.querySelector(targetSelector)
      if (!panel) return

      // Atributos de acessibilidade
      toggleBtn.setAttribute('aria-expanded', 'false')
      panel.setAttribute('aria-hidden', 'true')

      toggleBtn.addEventListener('click', () => {
        const expanded = panel.classList.toggle('expanded')
        toggleBtn.setAttribute('aria-expanded', String(expanded))
        panel.setAttribute('aria-hidden', String(!expanded))
      })
    })
}

// Bootstrap na carga do DOM, se existir ao menos um toggle
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-help-toggle]')) {
    initHelpPage()
  }
})
