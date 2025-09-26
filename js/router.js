// js/router.js
import { showSpinner, hideSpinner } from './utils/spinner.js'
import {
  renderHome,
  renderIptv,
  renderVod,
  renderRadio,
  renderWebcams,
  renderNotFound
} from './pages/index.js'

export function initRouter(container) {
  let cleanupCurrent = null

  // Realça o link ativo no menu
  function highlightNav(route) {
    document.querySelectorAll('.site-nav a').forEach(link => {
      // link.getAttribute('href') é algo como "#/iptv"
      const linkRoute = link.getAttribute('href').replace('#/', '')
      link.classList.toggle('active', linkRoute === route)
    })
  }

  // Trata a rota atual
  async function handleRoute() {
    // extraí "home" de "#" ou "#/home"
    const raw = location.hash.startsWith('#/') 
      ? location.hash.slice(2) 
      : ''
    const route = raw || 'home'

    highlightNav(route)

    // cleanup da página anterior
    if (typeof cleanupCurrent === 'function') {
      try {
        cleanupCurrent()
      } catch (err) {
        console.error('[Router] cleanup error:', err)
      }
      cleanupCurrent = null
    }

    showSpinner()
    let cleanupFn

    try {
      switch (route) {
        case 'home':
          cleanupFn = renderHome(container)
          break
        case 'iptv':
          cleanupFn = await renderIptv(container)
          break
        case 'vod':
          cleanupFn = await renderVod(container)
          break
        case 'radio':
          cleanupFn = await renderRadio(container)
          break
        case 'webcams':
          cleanupFn = await renderWebcams(container)
          break
        default:
          cleanupFn = renderNotFound(container)
      }
    } catch (err) {
      console.error('[Router] render error:', err)
      cleanupFn = renderNotFound(container)
    }

    hideSpinner()

    // armazena cleanup retornado pela página
    if (typeof cleanupFn === 'function') {
      cleanupCurrent = cleanupFn
    }
  }

  window.addEventListener('hashchange', handleRoute)
  // inicializa na carga
  handleRoute()
}
