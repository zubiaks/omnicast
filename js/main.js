// js/main.js

import { initRouter } from './router.js'
import { registerSW } from 'virtual:pwa-register'
import { showToast } from '@/utils/toast.js'

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
