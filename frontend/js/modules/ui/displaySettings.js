// frontend/js/modules/ui/displaySettings.js

import { configManager, CONFIG_CHANGE_EVENT } from '@modules/config'
import { applyTheme }                        from '@modules/ui/themeManager'
import { eventBus }                          from '@modules/utils/eventBus'

/** Labels para tema */
const THEME_LABELS = {
  dark:  'Escuro',
  light: 'Claro'
}

/** Labels para modo de exibição */
const VIEW_LABELS = {
  '':      'Normal',
  compact: 'Compacto',
  cinema:  'Cinema'
}

/** Sequência de modos de exibição cíclicos */
const VIEW_MODES = ['', 'compact', 'cinema']

/**
 * Inicializa o menu de seleção de tema e modo de exibição.
 *
 * @param {Object} [opts]
 * @param {string} [opts.buttonSelector='#display-settings']
 *   Seletor do botão que abre o menu.
 * @param {string} [opts.menuSelector='#display-menu']
 *   Seletor do contêiner do menu.
 * @param {string} [opts.themeLabelSelector='#theme-label']
 *   Seletor do elemento que mostra o nome do tema.
 * @param {string} [opts.viewLabelSelector='#viewmode-label']
 *   Seletor do elemento que mostra o nome do modo de exibição.
 * @param {Document|HTMLElement} [root=document]
 *   Raiz onde buscar elementos (útil para testes ou Shadow DOM).
 * @returns {() => void}
 *   Função de cleanup para remover todos os listeners.
 */
export function initDisplaySettings(
  {
    buttonSelector     = '#display-settings',
    menuSelector       = '#display-menu',
    themeLabelSelector = '#theme-label',
    viewLabelSelector  = '#viewmode-label'
  } = {},
  root = document
) {
  const cfg     = configManager.getAll()
  const btn     = root.querySelector(buttonSelector)
  const menu    = root.querySelector(menuSelector)
  const themeEl = root.querySelector(themeLabelSelector)
  const viewEl  = root.querySelector(viewLabelSelector)

  if (!btn || !menu || !themeEl || !viewEl) {
    console.warn('[displaySettings] elementos não encontrados:', {
      buttonSelector, menuSelector, themeLabelSelector, viewLabelSelector
    })
    return () => {}
  }

  // Coleção de listeners para cleanup
  const listeners = []
  function on(target, event, handler) {
    target.addEventListener(event, handler)
    listeners.push({ target, event, handler })
  }

  // Fecha o menu
  function closeMenu() {
    menu.classList.remove('show')
    btn.setAttribute('aria-expanded', 'false')
  }

  // Abre ou fecha
  function toggleMenu(e) {
    e.stopPropagation()
    const isOpen = menu.classList.toggle('show')
    btn.setAttribute('aria-expanded', String(isOpen))
  }

  // Aplica estado inicial (tema + viewmode)
  function applyInitial() {
    const tema = cfg.tema || 'light'
    applyTheme(tema)
    themeEl.textContent = THEME_LABELS[tema] || tema

    const vm = cfg.viewmode || ''
    document.body.classList.toggle('compact', vm === 'compact')
    document.body.classList.toggle('cinema',  vm === 'cinema')
    viewEl.textContent = VIEW_LABELS[vm] || vm
  }

  // Alterna tema e persiste
  function handleToggleTheme() {
    const current = configManager.get('tema') || 'light'
    const next    = current === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    configManager.updateConfig('tema', next)
    themeEl.textContent = THEME_LABELS[next]
  }

  // Alterna modo de exibição e persiste
  function handleToggleViewMode() {
    const current = configManager.get('viewmode') || ''
    const idx     = VIEW_MODES.indexOf(current)
    const next    = VIEW_MODES[(idx + 1) % VIEW_MODES.length]
    document.body.classList.toggle('compact', next === 'compact')
    document.body.classList.toggle('cinema',  next === 'cinema')
    configManager.updateConfig('viewmode', next)
    viewEl.textContent = VIEW_LABELS[next]
  }

  // Fecha menu ao clicar fora
  function handleDocumentClick(e) {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      closeMenu()
    }
  }

  // Fecha menu com Esc
  function handleKeydown(e) {
    if (e.key === 'Escape' && menu.classList.contains('show')) {
      closeMenu()
      btn.focus()
    }
  }

  // Reage a cliques dentro do menu
  function handleMenuClick(e) {
    const item = e.target.closest('[data-action]')
    if (!item) return
    if (item.dataset.action === 'theme')    handleToggleTheme()
    if (item.dataset.action === 'viewmode') handleToggleViewMode()
    closeMenu()
    btn.focus()
  }

  // Sincroniza se config mudar em outro lugar
  function handleConfigChange({ key, value }) {
    if (key === 'tema') {
      applyTheme(value)
      themeEl.textContent = THEME_LABELS[value]
    }
    if (key === 'viewmode') {
      document.body.classList.toggle('compact', value === 'compact')
      document.body.classList.toggle('cinema',  value === 'cinema')
      viewEl.textContent = VIEW_LABELS[value]
    }
  }

  // Associa listeners
  on(btn,   'click',    toggleMenu)
  on(document, 'click', handleDocumentClick)
  on(document, 'keydown', handleKeydown)
  on(menu,  'click',    handleMenuClick)
  eventBus.on(CONFIG_CHANGE_EVENT, handleConfigChange)

  // Estado inicial
  applyInitial()

  // Retorna cleanup
  return () => {
    listeners.forEach(({ target, event, handler }) =>
      target.removeEventListener(event, handler)
    )
    eventBus.off(CONFIG_CHANGE_EVENT, handleConfigChange)
    // Certifica-se de remover o menu se desejado
    closeMenu()
  }
}
