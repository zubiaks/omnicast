// frontend/js/modules/ui/formatSwitcher.js

import { configManager, CONFIG_CHANGE_EVENT } from '@modules/config'
import { eventBus }                          from '@modules/utils'

/** Formatos suportados */
const DEFAULT_FORMATS = ['16x9', '4x3', '16x10', '21x9', '9x16']

/**
 * Inicializa o seletor de formato (aspect ratio) do container principal.
 *
 * @param {Object} [opts]
 * @param {string} [opts.rootId='cockpit-root']
 *   ID do elemento root onde as classes de formato serão aplicadas.
 * @param {string} [opts.buttonSelector='.format-controls .btn.format']
 *   Seletor CSS para botões de formato.
 * @param {string} [opts.configKey='formatoInicial']
 *   Chave em config para persistir o formato selecionado.
 * @param {string[]} [opts.formats]
 *   Lista de formatos válidos (ex.: ['16x9','4x3',...]).
 * @param {Document|HTMLElement} [root=document]
 *   Raiz para querySelectors (útil em testes ou Shadow DOM).
 * @returns {() => void}
 *   Função de cleanup para remover listeners e sincronizações.
 */
export function initFormatSwitcher(
  {
    rootId         = 'cockpit-root',
    buttonSelector = '.format-controls .btn.format',
    configKey      = 'formatoInicial',
    formats        = DEFAULT_FORMATS
  } = {},
  root = document
) {
  const cfg       = configManager.getAll()
  const container = root.getElementById(rootId)
  const buttons   = Array.from(root.querySelectorAll(buttonSelector))
  if (!container || buttons.length === 0) {
    console.warn('[formatSwitcher] container ou botões não encontrados', {
      rootId, buttonSelector
    })
    return () => {}
  }

  // Helper para registrar listeners e facilitar cleanup
  const listeners = []
  function on(el, event, handler) {
    el.addEventListener(event, handler)
    listeners.push({ el, event, handler })
  }

  /**
   * Aplica o formato ao container e marca o botão ativo.
   *
   * @param {string} fmt — formato (ex.: '16x9').
   */
  function applyFormat(fmt) {
    if (!formats.includes(fmt)) {
      console.warn('[formatSwitcher] formato inválido:', fmt)
      return
    }

    // Remove todas as classes de formato e adiciona a nova
    container.classList.remove(...formats.map(f => `is-${f}`))
    container.classList.add(`is-${fmt}`)

    // Atualiza estado dos botões
    buttons.forEach(btn => {
      const isActive = btn.dataset.format === fmt
      btn.setAttribute('aria-pressed', String(isActive))
    })
  }

  /**
   * Define o formato e persiste no config.
   *
   * @param {string} fmt
   */
  function setFormat(fmt) {
    applyFormat(fmt)
    configManager.updateConfig(configKey, fmt)
  }

  /**
   * Sincroniza quando a config muda externamente.
   *
   * @param {{ key: string, value: any }} payload
   */
  function handleConfigChange({ key, value }) {
    if (key === configKey) {
      applyFormat(String(value))
    }
  }

  // Bind de clique em cada botão de formato
  buttons.forEach(btn => {
    on(btn, 'click', () => {
      const fmt = btn.dataset.format
      setFormat(fmt)
    })
  })

  // Reage a mudanças de configuração de outro módulo
  eventBus.on(CONFIG_CHANGE_EVENT, handleConfigChange)

  // Aplica estado inicial do config ou default
  const initial = cfg[configKey] || formats[0]
  applyFormat(initial)

  // Retorna cleanup
  return () => {
    listeners.forEach(({ el, event, handler }) =>
      el.removeEventListener(event, handler)
    )
    eventBus.off(CONFIG_CHANGE_EVENT, handleConfigChange)
    listeners.length = 0
  }
}
