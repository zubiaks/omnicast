// frontend/js/modules/ui/themeManager.js

import { configManager, CONFIG_CHANGE_EVENT } from '@modules/config'
import { eventBus }                          from '@modules/utils/eventBus'

const CONFIG_KEY  = 'tema'
const DARK_CLASS  = 'dark'
const LIGHT_CLASS = 'light'

/**
 * Aplica o tema ao <html> via atributo data-theme e classes CSS.
 *
 * @param {'dark'|'light'} theme
 */
export function applyTheme(theme) {
  const html = document.documentElement
  html.setAttribute('data-theme', theme)
  html.classList.toggle(DARK_CLASS, theme === DARK_CLASS)
  html.classList.toggle(LIGHT_CLASS, theme === LIGHT_CLASS)
}

/**
 * Determina o tema inicial salvo ou baseado na preferência do sistema.
 *
 * @returns {'dark'|'light'}
 */
function getInitialTheme() {
  const saved = configManager.get(CONFIG_KEY)
  if (saved === DARK_CLASS || saved === LIGHT_CLASS) {
    return saved
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? DARK_CLASS
    : LIGHT_CLASS
}

/**
 * Inicializa o tema ao carregar a página:
 * - calcula tema inicial
 * - aplica e persiste
 * - sincroniza mudanças externas de config
 *
 * @returns {() => void} Função de cleanup para listeners.
 */
export function initTheme() {
  // aplica e persiste o tema inicial
  const theme = getInitialTheme()
  applyTheme(theme)
  configManager.updateConfig(CONFIG_KEY, theme)

  // listener para mudanças de config de outros módulos
  function onConfigChange({ key, value }) {
    if (key === CONFIG_KEY) {
      applyTheme(value)
    }
  }
  eventBus.on(CONFIG_CHANGE_EVENT, onConfigChange)

  return () => {
    eventBus.off(CONFIG_CHANGE_EVENT, onConfigChange)
  }
}

/**
 * Alterna entre 'dark' e 'light', aplica e persiste novo valor.
 *
 * @returns {'dark'|'light'} o tema agora aplicado.
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme')
  const next    = current === DARK_CLASS ? LIGHT_CLASS : DARK_CLASS
  applyTheme(next)
  configManager.updateConfig(CONFIG_KEY, next)
  return next
}

/**
 * Retorna o tema atualmente aplicado no documento.
 *
 * @returns {'dark'|'light'}
 */
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || LIGHT_CLASS
}
