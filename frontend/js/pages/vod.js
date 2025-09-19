// frontend/js/pages/vod.js

import { initTheme }            from '@modules/ui/themeManager.js'
import { initDisplaySettings }  from '@modules/ui/displaySettings.js'
import { initUiControls }       from '@modules/ui/uiControls.js'
import { showToast }            from '@modules/ui/alerts.js'

import { initPwaUpdater }       from '@modules/network/pwaUpdater.js'
import { initOfflineHandler }   from '@modules/network/offlineHandler.js'

import { configManager }        from '@modules/config/configManager.js'

import { ListView }             from '@modules/list/listView.js'

import {
  buildCandidates,
  getFallback,
  applyImgFallback
} from '@modules/utils/ocUtils.js'
import { validateStream }       from '@modules/utils/validator-core.js'

import { initStreamPlayer }     from '@modules/media/streamPlayer.js'
import { toggleFavorite }       from '@modules/media/favorites.js'

/**
 * Inicializa a página de VOD:
 * - Lista paginada com busca, filtros por categoria e favoritos
 * - Validação de streams antes de exibir
 * - Player modal para reprodução de vídeo
 */
export async function initVODPage() {
  const cfg          = configManager.loadConfig()
  const { playItem } = initStreamPlayer({ maxRetries: cfg.playerMaxRetries })

  const view = new ListView({
    type:           'vod',
    containerId:    'vod-container',
    toolbar: {
      searchId:   'vod-search',
      sortId:     'vod-sort',
      sortDirId:  'vod-sort-dir',
      favBtnId:   'vod-favs',
      countsId:   'vod-counts',
      filters: [
        { id: 'vod-category', key: 'category' }
      ]
    },
    pageSize:       Infinity,
    paginationMode: 'button',
    emptyMessage:   'Nenhum título encontrado com os filtros atuais.',

    /**
     * Valida um item de VOD verificando o stream via HEAD/HLS.
     * @param {object} item
     * @returns {Promise<object>} item estendido com flag `online`
     */
    validateItem(item) {
      return validateStream(item)
        .then(({ online }) => ({ ...item, online }))
    },

    /**
     * Preenche o select de categoria com opções únicas.
     * @param {Array<object>} items
     */
    populateFilters(items) {
      const select = document.getElementById('vod-category')
      const cats   = [...new Set(items.map(i => i.category).filter(Boolean))].sort()
      select.innerHTML = [
        `<option value="">Todas as categorias</option>`,
        ...cats.map(c => `<option value="${c}">${c}</option>`)
      ].join('')
    },

    /**
     * Retorna o template HTML de cada card VOD.
     * @param {object} item
     * @param {number} idx
     * @param {boolean} isFav
     * @returns {string}
     */
    card(item, idx, isFav) {
      const name       = item.name || 'Sem título'
      const candidates = buildCandidates(item).join('|')
      const fallback   = getFallback(item.type)
      const category   = item.category ? ` — ${item.category}` : ''

      return `
        <div class="vod-card" tabindex="0" title="${name}">
          <img
            data-candidates="${candidates}"
            alt="${name}${category}"
            loading="lazy"
          >
          <h3>${isFav ? '★ ' : ''}${name}</h3>
          <div class="actions" data-idx="${idx}">
            <button class="btn btn-play" data-action="play">
              Assistir
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
      const container = document.getElementById('vod-container')
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

  try {
    await view.init()
  } catch (err) {
    console.error('[vod] falha ao inicializar ListView', err)
    showToast('Erro ao carregar vídeos.', { type: 'critical' })
  }
}

// Bootstrap do VOD page
document.addEventListener('DOMContentLoaded', () => {
  // Tema, display, PWA e offline
  initTheme()
  initDisplaySettings()
  const { updateAlert } = configManager.loadConfig()
  initPwaUpdater({ updateAlert })
  initOfflineHandler()
  initUiControls()

  // Dispara somente se existir o container
  if (document.getElementById('vod-container')) {
    initVODPage()
  }
})
