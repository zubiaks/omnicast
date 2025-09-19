/**
 * Centralizador de pages: mapeia rotas a inicializadores de controllers de página,
 * registra listener de hashchange e dispara a controller certa.
 *
 * Cada arquivo em `./pages/*.js` deve exportar uma função default que
 * inicializa aquela página (por ex.: export default function initHome() { … }).
 */

import initHome       from './home.js'
import initIptv       from './iptv.js'
import initVod        from './vod.js'
import initRadio      from './radio.js'
import initWebcams    from './webcams.js'
import initFavoritos  from './favoritos.js'
import initDashboard  from './dashboard.js'
import initConfigPage from './configPage.js'
import initHelp       from './help.js'

/** Rota → controller mapping */
const routeMap = {
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

/**
 * Inicializa o roteador de páginas baseado em hash.
 *
 * @returns {() => void} cleanup — remove o listener de hashchange.
 */
export function initPages() {
  function onHashChange() {
    const hash = window.location.hash || ''
    const controller = routeMap[hash] || initHome
    controller()
  }

  window.addEventListener('hashchange', onHashChange)
  onHashChange()

  return () => {
    window.removeEventListener('hashchange', onHashChange)
  }
}

/** Expõe o mapa de rotas (útil para E2E ou logs) */
export { routeMap }

// --- Export agregado ---
export const pagesModule = {
  initPages,
  routeMap
}
