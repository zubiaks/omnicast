// frontend/js/pages/home.js

import { initTheme }             from '@modules/ui/themeManager.js'
import { initDisplaySettings }   from '@modules/ui/displaySettings.js'
import { initUiControls }        from '@modules/ui/uiControls.js'
import { showToast }             from '@modules/ui/alerts.js'

import { initPwaUpdater }        from '@modules/network/pwaUpdater.js'
import { initOfflineHandler }    from '@modules/network/offlineHandler.js'

import { configManager }         from '@modules/config/configManager.js'

import { loadMasterList }        from '@modules/dataService/dataService.js'

import { validateStream }        from '@modules/utils/validator-core.js'

import {
  getFavoriteIds,
  countFavoritesByType
} from '@modules/media/favorites.js'

const CACHE_KEY = 'oc:master'
const TYPES     = ['iptv', 'webcam', 'vod', 'radio']

/**
 * Atualiza texto de elemento HTML por ID, se existir.
 * @param {string} id — ID do elemento
 * @param {string} text — texto a exibir
 */
function setText(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

/**
 * Carrega um fragmento HTML via fetch e injeta no container.
 * @param {string} selector — seletor CSS do container
 * @param {string} url — caminho para o HTML
 */
async function loadComponent(selector, url) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(res.statusText)
    const html = await res.text()
    const container = document.querySelector(selector)
    if (container) container.innerHTML = html
  } catch (err) {
    console.error(`[home] falha ao carregar ${url}:`, err)
  }
}

// Entry-point da home page
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Monta header e footer e sinaliza montagem
  await loadComponent('header', '/components/header.html')
  await loadComponent('footer', '/components/footer-home.html')
  document.dispatchEvent(new Event('oc:header-mounted'))

  // 2) Inits globais: tema, display, PWA, UI e offline
  initTheme()
  initDisplaySettings()
  const cfg = configManager.loadConfig()
  initPwaUpdater({ updateAlert: cfg.updateAlert })
  initUiControls()
  initOfflineHandler()

  // 3) Placeholders para contadores totais e de favoritos
  TYPES.forEach(type => {
    setText(`${type}-count`, '…')
    setText(`fav-count-${type}`, '…')
  })

  /**
   * Atualiza contagem de favoritos por tipo.
   * @param {Array<object>} data — lista mestre de items
   */
  function updateFavCounts(data) {
    const favSet = new Set(getFavoriteIds())
    const byType = countFavoritesByType(data, favSet)
    TYPES.forEach(type => {
      setText(`fav-count-${type}`, String(byType[type] ?? 0))
    })
  }

  /**
   * Atualiza contagem de streams por tipo (online ou total).
   * @param {Array<object>} data — lista mestre de items
   */
  async function updateCounts(data) {
    const results = await Promise.all(
      TYPES.map(async type => {
        const items = data.filter(i => i.type === type)
        if (!cfg.validateStreams) {
          return items.length
        }
        // Checa cada stream; conta os que retornam online=true
        const checks = await Promise.allSettled(
          items.map(i => validateStream(i))
        )
        return checks.filter(r => r.status === 'fulfilled' && r.value.online).length
      })
    )
    TYPES.forEach((type, idx) => {
      setText(`${type}-count`, String(results[idx]))
    })
  }

  // 4) Sincroniza favoritos entre abas via StorageEvent
  window.addEventListener('storage', e => {
    if (e.key === CACHE_KEY) {
      try {
        const arr = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
        if (Array.isArray(arr)) updateFavCounts(arr)
      } catch { /* silent */ }
    }
  })

  // 5) Tenta usar cache local antes de fetch
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        await updateCounts(arr)
        updateFavCounts(arr)
      }
    }
  } catch {
    console.warn('[home] cache inválido')
  }

  // 6) Fetch de dados frescos e atualização final
  try {
    const data = await loadMasterList()
    if (!Array.isArray(data) || data.length === 0) {
      TYPES.forEach(type => setText(`${type}-count`, 'Offline'))
      return
    }
    await updateCounts(data)
    updateFavCounts(data)
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('[home] loadMasterList error:', err)
    showToast('Erro ao carregar dados da home.', { type: 'critical' })
    TYPES.forEach(type => setText(`${type}-count`, 'Erro'))
  }
})
