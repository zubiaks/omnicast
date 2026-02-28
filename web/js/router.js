// web/js/router.js
import { showSpinner, hideSpinner } from './utils/spinner.js'
import { showToast }                from './utils/toast.js'
import analytics                    from './utils/analytics.js'
import { supabase }                 from './supabaseClient.js'
import locale                       from './utils/i18n.js'

export function initRouter(container) {
  let cleanupCurrent = null
  const protectedRoutes = new Set(['iptv', 'vod', 'radio', 'webcams'])

  function highlightNav(route) {
    document.querySelectorAll('.site-nav a').forEach(link => {
      const href = link.getAttribute('href') || ''
      const linkRoute = href.replace('#/', '')
      link.classList.toggle('active', linkRoute === route)
    })
  }

  const routeLoaders = {
    home:    () => import('./pages/home.js').then(m => m.default),
    login:   () => import('./pages/login.js').then(m => m.default),
    signup:  () => import('./pages/signup.js').then(m => m.default),
    iptv:    () => import('./pages/iptv.js').then(m => m.default),
    vod:     () => import('./pages/vod.js').then(m => m.default),
    radio:   () => import('./pages/radio.js').then(m => m.default),
    webcams: () => import('./pages/webcams.js').then(m => m.default),
    '*':     () => import('./pages/not-found.js').then(m => m.default)
  }

  async function getSessionSafe() {
    try {
      const res = await supabase.auth.getSession()
      return res?.data?.session ?? null
    } catch (err) {
      console.error('[Router] getSession failed', err)
      return null
    }
  }

  async function handleRoute() {
    const raw   = location.hash.startsWith('#/') ? location.hash.slice(2) : ''
    const route = raw || 'home'

    highlightNav(route)

    if (cleanupCurrent) {
      try { cleanupCurrent() } catch (e) { console.error('[Router] cleanup failed', e) }
      cleanupCurrent = null
    }

    const session = await getSessionSafe()
    if (protectedRoutes.has(route) && !session) {
      showToast(locale.t('router.loginRequired'), 'info')
      location.hash = '#/login'
      return
    }

    showSpinner()
    analytics.track('router.navigate', { route })

    const loader = routeLoaders[route] ?? routeLoaders['*']
    try {
      const renderFn     = await loader()
      const maybeCleanup = await renderFn(container, locale)
      cleanupCurrent     = typeof maybeCleanup === 'function' ? maybeCleanup : null
      showToast(locale.t('notifications.routeLoaded', { page: route }), 'success')
    } catch (err) {
      console.error('[Router] render failed', err)
      showToast(locale.t('router.renderError'), 'error')
      try {
        const render404 = await routeLoaders['*']()
        cleanupCurrent  = await render404(container, locale)
      } catch (e) {
        console.error('[Router] render404 failed', e)
      }
    } finally {
      hideSpinner()
    }
  }

  window.addEventListener('hashchange', handleRoute)
  window.addEventListener('load',       handleRoute)

  return () => {
    window.removeEventListener('hashchange', handleRoute)
    window.removeEventListener('load', handleRoute)
    if (cleanupCurrent) {
      try { cleanupCurrent() } catch {}
      cleanupCurrent = null
    }
  }
}
