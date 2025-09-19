// frontend/js/pages/webcams.js

import { initTheme }             from '@modules/ui/themeManager.js'
import { initDisplaySettings }   from '@modules/ui/displaySettings.js'
import { initUiControls }        from '@modules/ui/uiControls.js'
import { showToast }             from '@modules/ui/alerts.js'

import { initPwaUpdater }        from '@modules/network/pwaUpdater.js'
import { initOfflineHandler }    from '@modules/network/offlineHandler.js'

import { configManager }         from '@modules/config/configManager.js'

import { ListView }              from '@modules/list/listView.js'

import {
  buildCandidates,
  getFallback,
  applyImgFallback
} from '@modules/utils/ocUtils.js'
import { validateStream }        from '@modules/utils/validator-core.js'

import { initStreamPlayer }      from '@modules/media/streamPlayer.js'
import { toggleFavorite }        from '@modules/media/favorites.js'

/**
 * Inicializa a página de Webcams:
 * - Listagem infinita com filtros país/cidade
 * - Validação de stream via HEAD/HLS
 * - Favoritos e reprodução em modal
 */
export async function initWebcamsPage() {
  const cfg          = configManager.loadConfig()
  const { playItem } = initStreamPlayer({ maxRetries: cfg.playerMaxRetries })

  const view = new ListView({
    type:           'webcam',
    containerId:    'webcam-list',
    toolbar: {
      searchId:   'webcam-search',
      sortId:     'webcam-sort',
      sortDirId:  'webcam-sort-dir',
      favBtnId:   'webcam-favs',
      countsId:   'webcam-counts',
      filters: [
        { id: 'webcam-country', key: 'country' },
        { id: 'webcam-city',    key: 'city' }
      ]
    },
    moreBtnId:      'webcam-more',
    sentinelId:     'webcam-sentinel',
    pageSize:       24,
    paginationMode: 'infinite',
    emptyMessage:   'Nenhuma webcam encontrada com os filtros atuais.',

    /**
     * Popula selects de filtros com opções de países e cidades.
     * @param {Array<object>} items
     */
    populateFilters(items) {
      const countryEl = document.getElementById('webcam-country')
      const cityEl    = document.getElementById('webcam-city')

      const countries = [...new Set(
        items.map(i => i.country).filter(Boolean)
      )].sort()
      countryEl.innerHTML = [
        `<option value="">Todos os países</option>`,
        ...countries.map(c => `<option value="${c}">${c}</option>`)
      ].join('')

      countryEl.addEventListener('change', () => {
        const selCountry = countryEl.value
        const pool = selCountry
          ? items.filter(i => i.country === selCountry)
          : items
        const cities = [...new Set(
          pool.map(i => i.city).filter(Boolean)
        )].sort()
        cityEl.innerHTML = [
          `<option value="">Todas as cidades</option>`,
          ...cities.map(c => `<option value="${c}">${c}</option>`)
        ].join('')
      })
    },

    /**
     * Gera o HTML de cada card de webcam.
     * @param {object} item
     * @param {number} idx
     * @param {boolean} isFav
     * @returns {string}
     */
    card(item, idx, isFav) {
      const candidates = buildCandidates(item).join('|')
      const fallback   = getFallback(item.type)
      const place      = [item.city, item.country]
        .filter(Boolean)
        .join(', ')

      return `
        <div class="card" style="border-top:4px solid var(--webcam)">
          <img
            data-candidates="${candidates}"
            alt="${item.name}${place ? ' — ' + place : ''}"
            loading="lazy"
          >
          <h2>${item.name}</h2>
          <p>${place}</p>
          <div class="actions" data-idx="${idx}">
            <button class="btn btn-play" data-action="play">
              ▶️ Ver
            </button>
            <button class="btn btn-fav" data-action="fav">
              ${isFav ? '★' : '☆'} Favorito
            </button>
          </div>
        </div>
      `
    },

    /**
     * Após renderizar:
     * - Injeta imagens lazy e tentativa de fallback
     * - Liga botões de play e favorito
     */
    afterRender() {
      const container = document.getElementById('webcam-list')
      applyImgFallback(container)

      container.querySelectorAll('.actions').forEach(div => {
        const idx  = Number(div.dataset.idx)
        const item = view.filteredCache[idx]

        div.querySelector('[data-action="play"]')
           .addEventListener('click', () => playItem(item))

        div.querySelector('[data-action="fav"]')
           .addEventListener('click', () => {
             toggleFavorite(item.id)
             view.applyFilters()
           })
      })
    },

    /**
     * Valida um item antes de exibir,
     * marcando online/offline no cache interno.
     * @param {object} item
     * @returns {Promise<object>}
     */
    validateItem(item) {
      return validateStream(item)
        .then(({ online }) => ({ ...item, online }))
    }
  })

  try {
    await view.init()
  } catch (err) {
    console.error('[webcams] falha ao inicializar ListView', err)
    showToast('Erro ao carregar webcams.', { type: 'critical' })
  }
}

// Auto-bootstrap na carga do DOM
document.addEventListener('DOMContentLoaded', () => {
  // Inicia tema, layout, PWA, offline e controles de UI
  initTheme()
  initDisplaySettings()
  const { updateAlert } = configManager.loadConfig()
  initPwaUpdater({ updateAlert })
  initOfflineHandler()
  initUiControls()

  // Dispara apenas se existir o container de webcams
  if (document.getElementById('webcam-list')) {
    initWebcamsPage()
  }
})
