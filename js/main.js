// js/main.js

import { initRouter } from './router.js'

const container = document.querySelector('#main-content')
initRouter(container)

// Service Worker registration for v0.1.0 – inclui dados de streaming no cache
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./js/sw.js', { scope: './' })
      .then(reg => {
        console.log('[SW] Registrado v0.1.0:', reg.scope)
      })
      .catch(err => {
        console.error('[SW] Falha ao registrar SW:', err)
      })
  })
}
