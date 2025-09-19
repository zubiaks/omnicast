// frontend/js/pages/iptv.js

import { initTheme }            from '@modules/ui/themeManager.js'
import { initDisplaySettings }  from '@modules/ui/displaySettings.js'
import { initUiControls }       from '@modules/ui/uiControls.js'

import { initPwaUpdater }       from '@modules/network/pwaUpdater.js'
import { configManager }        from '@modules/config/configManager.js'

import { ListView }             from '@modules/list/listView.js'

import {
  validateStream,
  buildCandidates,
  getFallback,
  applyImgFallback
} from '@modules/utils/ocUtils.js'
import { validateStream as checkStream } from '@modules/utils/validator-core.js'

import { initStreamPlayer }     from '@modules/media/streamPlayer.js'
import { toggleFavorite }       from '@modules/media/favorites.js'

/**
 * Inicializa a página de IPTV:
 * - Listagem infinita com filtros por país/categoria
 * - Validação de streams via HEAD e HLS
 * - Favorecimento e reprodução em modal/player
 */
export async function initIPTVPage() {
  const cfg          = configManager.loadConfig()
  const { playItem } = initStreamPlayer({ maxRetries: cfg.playerMaxRetries })

  const view = new ListView({
    type:           'iptv',
    containerId:    'iptv-grid',
    toolbar: {
      searchId:    'iptv-search',
      sortId:      'iptv-sort',
      sortDirId:   'iptv-sort-dir',
      favBtnId:    'iptv-favs',
      countsId:    'iptv-counts',
      filters: [
        { id: 'iptv-country',  key: 'country'  },
        { id: 'iptv-category', key: 'category' }
      ]
    },
    moreBtnId:      'iptv-more',
    sentinelId:     'iptv-sentinel',
    pageSize:       24,
    paginationMode: 'infinite',
    emptyMessage:   'Nenhum canal encontrado com os filtros atuais.',

    /**
     * Valida um item executando HEAD/HLS e retorna flag `online`.
     * @param {object} item
     * @returns {Promise<object>}
     */
    validateItem(item) {
      return checkStream(item)
        .then(({ online }) => ({ ...item, online }))
    },

    /**
     * Popula selects de filtros com opções únicas.
     * @param {Array<object>} items
     */
    populateFilters(items) {
      const countryEl  = document.getElementById('iptv-country')
      const categoryEl = document.getElementById('iptv-category')

      const countries = [...new Set(items.map(i => i.country).filter(Boolean))].sort()
      countryEl.innerHTML = [
        `<option value="">Todos os países</option>`,
        ...countries.map(c => `<option value="${c}">${c}</option>`)
      ].join('')

      countryEl.addEventListener('change', () => {
        const sel = countryEl.value
        const pool = sel ? items.filter(i => i.country === sel) : items
        const cats = [...new Set(pool.map(i => i.category).filter(Boolean))].sort()
        categoryEl.innerHTML = [
          `<option value="">Todas as categorias</option>`,
          ...cats.map(c => `<option value="${c}">${c}</option>`)
        ].join('')
      })
    },

    /**
     * Renderiza cada card com imagem lazy e ações.
     * @param {object} item
     * @param {number} idx
     * @param {boolean} isFav
     */
    card(item, idx, isFav) {
      const candidates = buildCandidates(item).join('|')
      const fallback   = getFallback(item.type)
      const place      = [item.country, item.category].filter(Boolean).join(' • ')

      return `
        <div class="card" style="border-top:4px solid var(--iptv)">
          <img
            data-candidates="${candidates}"
            alt="${item.name}${place ? ' — ' + place : ''}"
            loading="lazy"
          >
          <h2>${item.name}</h2>
          <p>${place}</p>
          <div class="actions" data-idx="${idx}">
            <button class="btn btn-play" data-action="play">
              ▶️ Play
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
     * - Injeta imagens com lazy-load e fallback
     * - Liga botões de play e favorito
     */
    afterRender() {
      const container = document.getElementById('iptv-grid')
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
    }
  })

  await view.init()
}

// Entry-point: iniciais de UI e disparo de initIPTVPage()
document.addEventListener('DOMContentLoaded', () => {
  initTheme()
  initDisplaySettings()

  const { updateAlert } = configManager.loadConfig()
  initPwaUpdater({ updateAlert })

  initUiControls()

  if (document.getElementById('iptv-grid')) {
    initIPTVPage()
  }
})
