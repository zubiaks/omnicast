// web/js/sw-register.js
import { showToast } from '@/utils/toast.js'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      console.log('[SW] registrado com scope:', registration.scope)

      if (registration.waiting) {
        notifyUpdate(registration.waiting)
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              notifyUpdate(newWorker)
            } else {
              console.log('[SW] pré-cache pronto para primeira visita.')
            }
          }
        })
      })

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] controllerchange – recarregando para nova versão')
        window.location.reload()
      })
    } catch (err) {
      console.error('[SW] falha ao registrar:', err)
    }
  })
}

function notifyUpdate(worker) {
  showToast('Nova versão disponível – atualizando...', 'info')
  worker.postMessage({ type: 'SKIP_WAITING' })
}
