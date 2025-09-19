// frontend/js/modules/ui/componentLoader.js

import { eventBus } from '@modules/utils/eventBus.js'

/** Evento emitido após sucesso no carregamento do componente */
export const COMPONENT_LOADED_EVENT = 'component:loaded'

/** Evento emitido em caso de falha ao carregar o componente */
export const COMPONENT_ERROR_EVENT  = 'component:error'

/**
 * Carrega dinamicamente um fragmento HTML e executa scripts inline.
 *
 * @param {string} targetSelector        — Seletor CSS do container de destino.
 * @param {string} componentPath         — Caminho (absoluto ou alias) do HTML.
 * @param {Object} [options]
 * @param {Function} [options.onLoad]    — Callback (container: HTMLElement).
 * @param {Function} [options.onError]   — Callback (error: Error).
 * @param {RequestInit['cache']} [options.cache] — Política de cache do fetch (default 'no-store').
 * @param {Document|HTMLElement} [options.root]   — Raiz para querySelector (default document).
 * @returns {Promise<HTMLElement|null>} Container preenchido ou null em erro.
 */
export async function loadComponent(
  targetSelector,
  componentPath,
  {
    onLoad,
    onError,
    cache = 'no-store',
    root  = document
  } = {}
) {
  const container = root.querySelector(targetSelector)
  if (!container) {
    const err = new Error(
      `loadComponent: seletor "${targetSelector}" não encontrado`
    )
    console.error(err)
    onError?.(err)
    eventBus.emit(COMPONENT_ERROR_EVENT, { path: componentPath, error: err })
    return null
  }

  try {
    const response = await fetch(componentPath, { cache })
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ao carregar "${componentPath}"`
      )
    }

    const html = await response.text()
    container.innerHTML = html

    // Executa scripts inline para ativar comportamentos JS
    container.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes)
           .forEach(attr => newScript.setAttribute(attr.name, attr.value))
      newScript.textContent = oldScript.textContent
      oldScript.replaceWith(newScript)
    })

    onLoad?.(container)
    eventBus.emit(COMPONENT_LOADED_EVENT, { path: componentPath, container })
    return container
  } catch (error) {
    console.error(
      `[componentLoader] erro ao carregar "${componentPath}":`,
      error
    )
    onError?.(error)
    eventBus.emit(COMPONENT_ERROR_EVENT, { path: componentPath, error })
    return null
  }
}
