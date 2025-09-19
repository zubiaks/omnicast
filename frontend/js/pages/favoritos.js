// frontend/js/pages/favoritos.js

import { initTheme }              from '@modules/ui/themeManager.js'
import { initDisplaySettings }    from '@modules/ui/displaySettings.js'
import { initUiControls }         from '@modules/ui/uiControls.js'
import { showToast }              from '@modules/ui/alerts.js'
import { initPwaUpdater }         from '@modules/network/pwaUpdater.js'
import { configManager }          from '@modules/config/configManager.js'
import { ListView }               from '@modules/list/listView.js'
import {
  getFavoriteIds,
  toggleFavorite
} from '@modules/media/favorites.js'

/**
 * Inicializa a página de Favoritos:
 * - Renderiza apenas itens marcados como favoritos
 * - Usa ListView para exibição de cards
 * - Permite remover favoritos na própria página
 */
export async function initFavoritesPage() {
  // 1) Inits comuns de UI, tema e PWA
  initTheme()
  initDisplaySettings()

  const cfg = configManager.loadConfig()
  initPwaUpdater({ updateAlert: cfg.updateAlert })
  initUiControls()

  // 2) Verifica container de favoritos
  const containerId = 'favoritos-grid'
  const container   = document.getElementById(containerId)
  if (!container) return

  // 3) Configura ListView para favoritos
  const view = new ListView({
    type:           'all',
    containerId,
    toolbar: {
      searchId:  `${containerId}-search`,
      sortId:    `${containerId}-sort`,
      sortDirId: `${containerId}-sort-dir`,
      favBtnId:  `${containerId}-favs`,
      countsId:  `${containerId}-counts`,
      filters:   []
    },
    pageSize:       Infinity,
    paginationMode: 'button',
    emptyMessage:   'Nenhum favorito encontrado',

    filterItems(items) {
      const favSet = new Set(getFavoriteIds())
      return items.filter(item => favSet.has(item.id))
    },

    card(item, idx, isFav) {
      return `
        <div class="card">
          <h2>${item.name}</h2>
          <button class="card__fav-btn" data-action="fav">
            ${isFav ? '★' : '☆'}
          </button>
        </div>
      `
    },

    afterRender() {
      const favButtons = container.querySelectorAll('[data-action="fav"]')
      favButtons.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          const id = view.filteredCache[i].id
          toggleFavorite(id)
          view.applyFilters()
          showToast('Favorito removido', { type: 'info' })
        })
      })
    }
  })

  await view.init()
}

// Entry-point
document.addEventListener('DOMContentLoaded', () => {
  initFavoritesPage()
})
