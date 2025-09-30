// js/main.js

import { initRouter } from './router.js'
import { registerSW } from 'virtual:pwa-register'
import { showToast } from '@/utils/toast.js'
import { getCLS, getFID, getLCP, getFCP } from 'web-vitals'

/**
 * Envia métrica para o endpoint de monitoring via Beacon API
 * @param {{name: string, value: number, delta: number, id?: string}} metric
 */
function sendToMonitoring(metric) {
  const payload = {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    href: window.location.href,
    timestamp: Date.now()
  }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  navigator.sendBeacon('/api/metrics', blob)
}

// Instrumentação de Web Vitals
getCLS(sendToMonitoring)
getFID(sendToMonitoring)
getLCP(sendToMonitoring)
getFCP(sendToMonitoring)

const container = document.querySelector('#main-content')
initRouter(container)

const updateSW = registerSW({
  onNeedRefresh() {
    showToast('Nova versão disponível! Clique para atualizar.', 'info')
  },
  onOfflineReady() {
    showToast('App pronto para uso offline.', 'success')
  }
})

document.addEventListener('click', e => {
  if (e.target.matches('.toast--info')) {
    updateSW(true)
  }
})
