// frontend/js/modules/network/offlineHandler.js

import { configManager } from '@modules/config'
import { showToast }     from '@modules/ui/alerts'
import { eventBus }      from '@modules/utils'

/** Evento emitido quando a rede fica offline */
export const NETWORK_OFFLINE_EVENT = 'network:offline'

/** Evento emitido quando a rede volta online */
export const NETWORK_ONLINE_EVENT  = 'network:online'

/**
 * Gerencia exibição de banner e emissão de eventos
 * ao detectar mudanças de estado da conexão.
 *
 * @param {Object} [opts]
 * @param {string} [opts.bannerClass='offline-banner']
 *   Classe CSS do contêiner do banner.
 * @param {string} [opts.retryBtnClass='offline-banner__retry']
 *   Classe CSS do botão de retry dentro do banner.
 * @param {string} [opts.message]
 *   Mensagem customizada ao ficar offline.
 * @param {boolean} [opts.showAlert]
 *   Override para habilitar/desabilitar banner (config.offlineAlert).
 * @param {Document|HTMLElement} [root=document]
 *   Raiz do DOM onde o banner será inserido.
 * @returns {() => void}
 *   Função de cleanup para remover listeners e banner.
 */
export function initOfflineHandler(
  {
    bannerClass   = 'offline-banner',
    retryBtnClass = 'offline-banner__retry',
    message,
    showAlert
  } = {},
  root = document
) {
  const cfg           = configManager.getAll()
  const alertEnabled  = showAlert ?? cfg.offlineAlert ?? true

  if (!alertEnabled) {
    return () => {}
  }

  let bannerEl, retryBtn

  // Cria banner no DOM
  function createBanner() {
    bannerEl = root.querySelector(`.${bannerClass}`)
    if (bannerEl) return

    bannerEl = document.createElement('div')
    bannerEl.className = bannerClass
    bannerEl.setAttribute('role', 'alert')
    bannerEl.setAttribute('aria-live', 'assertive')
    bannerEl.innerHTML = `
      <span class="${bannerClass}__message">
        ${message || cfg.offlineMessage || 'Você está sem conexão. Verifique sua rede.'}
      </span>
      <button type="button" class="${retryBtnClass}">
        Tentar novamente
      </button>
    `
    root.body.appendChild(bannerEl)
  }

  // Exibe banner e vincula retry
  function showBanner() {
    createBanner()
    bannerEl.classList.add(`${bannerClass}--visible`)
    retryBtn = bannerEl.querySelector(`.${retryBtnClass}`)
    retryBtn?.addEventListener('click', onRetry)
  }

  // Esconde banner e desvincula retry
  function hideBanner() {
    if (!bannerEl) return
    bannerEl.classList.remove(`${bannerClass}--visible`)
    retryBtn?.removeEventListener('click', onRetry)
  }

  // Retry: recarrega se online, senão exibe toast
  function onRetry() {
    if (navigator.onLine) {
      hideBanner()
      eventBus.emit(NETWORK_ONLINE_EVENT)
      location.reload()
    } else {
      showToast(
        cfg.offlineRetryMessage || 'Ainda sem conexão. Tente novamente mais tarde.',
        { type: 'warning' }
      )
    }
  }

  // Listeners da API de rede
  const listeners = [
    { target: window, event: 'offline', handler: () => {
      showBanner()
      eventBus.emit(NETWORK_OFFLINE_EVENT)
    }},
    { target: window, event: 'online', handler: () => {
      hideBanner()
      showToast(cfg.offlineRestoreMessage || 'Conexão restabelecida!', { type: 'info' })
      eventBus.emit(NETWORK_ONLINE_EVENT)
    }}
  ]

  listeners.forEach(({ target, event, handler }) =>
    target.addEventListener(event, handler)
  )

  // Se já estiver offline ao iniciar
  if (!navigator.onLine) {
    showBanner()
    eventBus.emit(NETWORK_OFFLINE_EVENT)
  }

  // Retorna cleanup
  return () => {
    listeners.forEach(({ target, event, handler }) =>
      target.removeEventListener(event, handler)
    )
    retryBtn?.removeEventListener('click', onRetry)
    bannerEl?.remove()
  }
}
