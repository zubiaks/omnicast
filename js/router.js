// js/router.js
import { showSpinner, hideSpinner } from './utils/spinner.js'

export function initRouter(container) {
  let cleanupCurrent = null

  function highlightNav(route) {
    document.querySelectorAll('.site-nav a').forEach(link => {
      const linkRoute = link.getAttribute('href').replace('#/', '')
      link.classList.toggle('active', linkRoute === route)
    })
  }

  async function handleRoute() {
    const raw   = location.hash.startsWith('#/') ? location.hash.slice(2) : ''
    const route = raw || 'home'

    highlightNav(route)

    if (typeof cleanupCurrent === 'function') {
      try { cleanupCurrent() }
      catch (err) { console.error('[Router] cleanup error:', err) }
      cleanupCurrent = null
    }

    showSpinner()
    let cleanupFn

    try {
      switch (route) {
        case 'home': {
          const { renderHome } = await import('./pages/home.js')
          cleanupFn = renderHome(container)
          break
        }
        case 'iptv': {
          const { renderIptv } = await import('./pages/iptv.js')
          cleanupFn = await renderIptv(container)
          break
        }
        case 'vod': {
          const { renderVod } = await import('./pages/vod.js')
          cleanupFn = renderVod(container)
          break
        }
        case 'radio': {
          const { renderRadio } = await import('./pages/radio.js')
          cleanupFn = renderRadio(container)
          break
        }
        case 'webcams': {
          const { renderWebcams } = await import('./pages/webcams.js')
          cleanupFn = renderWebcams(container)
          break
        }
        default: {
          const { renderNotFound } = await import('./pages/not-found.js')
          cleanupFn = renderNotFound(container)
        }
      }
    } catch (err) {
      console.error('[Router] render error:', err)
      const { renderNotFound } = await import('./pages/not-found.js')
      cleanupFn = renderNotFound(container)
    }

    hideSpinner()
    if (typeof cleanupFn === 'function') cleanupCurrent = cleanupFn
  }

  window.addEventListener('hashchange', handleRoute)
  handleRoute()
}
