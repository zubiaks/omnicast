/**
 * Centralizador de pages: mapeia rotas a inicializadores de controllers de página,
 * registra listener de hashchange e dispara a controller certa.
 *
 * Cada arquivo em `./pages/*.js` deve exportar uma função default que
 * inicializa aquela página (por ex.: export default function initHome() { … }).
 */

import { eventBus } from '@modules/utils/eventBus.js'

import initHome       from './home.js'
import initIptv       from './iptv.js'
import initVod        from './vod.js'
import initRadio      from './radio.js'
import initWebcams    from './webcams.js'
import initFavoritos  from './favoritos.js'
import initDashboard  from './dashboard.js'
import initConfigPage from './configPage.js'
import initHelp       from './help.js'

/** Evento público de navegação de rota (telemetria/UI) */
export const ROUTE_CHANGE_EVENT = 'route:change'

/** Rota → controller mapping */
export const routeMap = {
  '':            initHome,
  '#home':       initHome,
  '#iptv':       initIptv,
  '#vod':        initVod,
  '#radio':      initRadio,
  '#webcams':    initWebcams,
  '#favoritos':  initFavoritos,
  '#dashboard':  initDashboard,
  '#config':     initConfigPage,
  '#help':       initHelp
}

/** Normaliza o hash removendo querystring e espaços. */
function normalizeHash(raw = '') {
  const h = String(raw).trim()
  const [base] = h.split('?')
  return base || ''
}

/**
 * Inicializa o roteador de páginas baseado em hash.
 *
 * @returns {() => void} cleanup — remove o listener de hashchange.
 */
export function initPages() {
  if (typeof window === 'undefined') return () => {}

  let lastHash = null

  function dispatchRouteChange(detail) {
    // CustomEvent no window (desacoplado)
    try { window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT, { detail })) } catch {}
    // Emissão no eventBus para métricas/telemetria
    try { eventBus.emit(ROUTE_CHANGE_EVENT, detail) } catch {}
  }

  function onHashChange() {
    const currentRaw = window.location.hash || ''
    const current = normalizeHash(currentRaw)

    if (current === lastHash) return
    lastHash = current

    const controller = routeMap[current] || initHome

    try {
      controller()
      dispatchRouteChange({ hash: current, ok: true })
    } catch (err) {
      console.error('[pages] erro ao inicializar controller para', current, err)
      dispatchRouteChange({ hash: current, ok: false, error: err })

      if (controller !== initHome) {
        try {
          initHome()
          dispatchRouteChange({ hash: '#home', ok: true, fallback: true })
        } catch (e2) {
          console.error('[pages] fallback home também falhou', e2)
        }
      }
    }
  }

  window.addEventListener('hashchange', onHashChange)
  onHashChange()

  return () => {
    window.removeEventListener('hashchange', onHashChange)
  }
}

// --- Export agregado ---
export const pagesModule = {
  initPages,
  routeMap,
  ROUTE_CHANGE_EVENT
}

export default pagesModule
