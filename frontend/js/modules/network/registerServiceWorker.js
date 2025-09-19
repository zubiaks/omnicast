// frontend/js/modules/network/registerServiceWorker.js

import { configManager } from '@modules/config/configManager.js'

/** Chave em config para caminho do Service Worker */
export const SW_PATH_KEY   = 'swPath'

/** Chave em config para escopo do Service Worker */
export const SW_SCOPE_KEY  = 'swScope'

/**
 * Registra o Service Worker e dispara callbacks de ciclo de vida:
 * - onSuccess(registration)
 * - onUpdateFound(worker)
 * - onControllerChange()
 *
 * @param {Object} [opts]
 * @param {string} [opts.path]               — caminho do SW (default: config.swPath ∥ '/sw.js')
 * @param {string} [opts.scope]              — escopo do SW (default: config.swScope ∥ '/')
 * @param {Function} [opts.onSuccess]        — chamado após registro bem-sucedido (registration)
 * @param {Function} [opts.onUpdateFound]    — chamado quando um novo SW é instalado (worker)
 * @param {Function} [opts.onControllerChange] — chamado quando o controller muda
 */
export function registerServiceWorker({
  path,
  scope,
  onSuccess,
  onUpdateFound,
  onControllerChange
} = {}) {
  if (!('serviceWorker' in navigator)) return

  const cfg      = configManager.loadConfig()
  const swPath   = path  ?? cfg[SW_PATH_KEY]  ?? '/sw.js'
  const swScope  = scope ?? cfg[SW_SCOPE_KEY] ?? '/'

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(swPath, { scope: swScope })
      console.log(`[SW] registrado em: ${registration.scope}`)
      onSuccess?.(registration)

      // Se já existe SW em waiting, sinaliza update pronto
      if (registration.waiting) {
        onUpdateFound?.(registration.waiting)
      }

      // Detecta novos SWs durante a sessão
      registration.addEventListener('updatefound', () => {
        const newSW = registration.installing
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateFound?.(newSW)
          }
        })
      })

      // Notifica mudança de controller (após skipWaiting)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] controllerchange')
        onControllerChange?.()
      })
    } catch (err) {
      console.error('[SW] falha ao registrar:', err)
    }
  })
}

/**
 * Solicita ao Service Worker ativo ou em waiting que salte para "activated".
 * Utilizado após onUpdateFound para aplicar update sem forçar reload imediato.
 */
export function activateUpdate() {
  const controller = navigator.serviceWorker.controller
  if (controller) {
    controller.postMessage({ type: 'SKIP_WAITING' })
    return
  }
  // tenta obter via ready registration
  navigator.serviceWorker.ready
    .then(reg => reg.waiting?.postMessage({ type: 'SKIP_WAITING' }))
    .catch(() => {
      console.warn('[SW] nenhum worker disponível para SKIP_WAITING')
    })
}

/**
 * Desregistra o Service Worker atual, se houver.
 * Útil para debugging ou reset completo da aplicação.
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
      console.log('[SW] desregistrado')
    }
  } catch (err) {
    console.error('[SW] falha ao desregistrar:', err)
  }
}
