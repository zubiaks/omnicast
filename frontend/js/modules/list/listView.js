// frontend/js/modules/list/listView.js

import { loadMasterList }         from '@modules/dataService/dataService.js'
import { validateStream }         from '@modules/utils/validator-core.js'
import {
  normalize,
  escapeHtml,
  escapeRegExp,
  applyImgFallback
} from '@modules/utils/ocUtils.js'
import {
  toggleFavorite,
  getFavoriteIds
} from '@modules/media/favorites.js'
import { showToast }              from '@modules/ui/alerts.js'

/**
 * ListView: abstração para exibir lista de cards/table com filtros,
 * paginação (button/infinite), ordenação e favoritos.
 */
export class ListView {
  constructor(cfg) {
    this.cfg           = cfg
    this.itemsCache    = []
    this.filteredCache = []
    this.favs          = new Set(getFavoriteIds())
    this.page          = 1
    this.ioObserver    = null

    // Elementos do toolbar e container
    this.$container  = document.getElementById(cfg.containerId)
    const tb = cfg.toolbar || {}
    this.$search     = document.getElementById(tb.searchId)
    this.$sortSelect = document.getElementById(tb.sortId)
    this.$sortDirBtn = document.getElementById(tb.sortDirId)
    this.$favBtn     = document.getElementById(tb.favBtnId)
    this.$countsEl   = document.getElementById(tb.countsId)
    this.$moreBtn    = document.getElementById(cfg.moreBtnId)
    this.$sentinel   = document.getElementById(cfg.sentinelId)

    this.debouncedFilter = this.debounce(this.applyFilters.bind(this), 200)

    window.addEventListener('storage', e => {
      if (e.key === 'oc:favorites') {
        this.favs = new Set(getFavoriteIds())
        this.applyFilters()
      }
    })
  }

  /**
   * Retorna estado atual de busca, ordenação, filtro e favoritos.
   */
  getState() {
    const q        = normalize(this.$search?.value || '')
    const sort     = this.$sortSelect?.value || ''
    const dir      = this.$sortDirBtn?.dataset.dir || 'asc'
    const onlyFavs = this.$favBtn?.getAttribute('aria-pressed') === 'true'
    const filters  = (this.cfg.toolbar.filters || [])
      .reduce((acc, f) => {
        const el = document.getElementById(f.id)
        if (el?.value) acc[f.key] = el.value
        return acc
      }, {})
    return { q, sort, dir, onlyFavs, filters }
  }

  /**
   * Atualiza texto de contagem "Mostrando X de Y".
   */
  updateCounts(shown) {
    if (this.$countsEl) {
      const total = this.itemsCache.length
      this.$countsEl.textContent = `Mostrando ${shown} de ${total}`
    }
  }

  /**
   * Renderiza a página atual: skeleton, cards, botão "mais" ou infinite scroll.
   */
  renderPage() {
    const {
      pageSize = Infinity,
      paginationMode = 'button',
      card,
      emptyMessage = 'Nenhum item encontrado.'
    } = this.cfg

    const end   = this.page * pageSize
    const slice = this.filteredCache.slice(0, end)

    this.$container.innerHTML = ''
    if (!slice.length) {
      this.$container.innerHTML = `<p class="tip">${escapeHtml(emptyMessage)}</p>`
      this.updateCounts(0)
      return
    }

    const frag = document.createDocumentFragment()
    slice.forEach((item, idx) => {
      const html    = card(item, idx, this.favs.has(item.id))
      const wrapper = document.createElement('div')
      wrapper.innerHTML = html
      frag.appendChild(wrapper.firstElementChild)
    })
    this.$container.appendChild(frag)
    applyImgFallback(this.$container)
    this.updateCounts(slice.length)

    if (this.$moreBtn) {
      const showMore = paginationMode === 'button' && end < this.filteredCache.length
      this.$moreBtn.style.display = showMore ? '' : 'none'
    }

    if (this.ioObserver) {
      this.ioObserver.disconnect()
    }
    if (
      paginationMode === 'infinite' &&
      end < this.filteredCache.length &&
      this.$sentinel
    ) {
      this.ioObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          this.page++
          this.renderPage()
        }
      }, { rootMargin: '150px' })
      this.ioObserver.observe(this.$sentinel)
    }
  }

  /**
   * Aplica filtros, busca e ordenação na lista em cache.
   */
  applyFilters() {
    const { q, sort, dir, onlyFavs, filters } = this.getState()
    const termRegex = q ? new RegExp(escapeRegExp(q), 'i') : null

    this.filteredCache = this.itemsCache.filter(item => {
      if (onlyFavs && !this.favs.has(item.id)) return false
      if (termRegex) {
        const hay = normalize(
          `${item.title||''} ${item.category||''} ${item.location?.city||''}`
        )
        if (!termRegex.test(hay)) return false
      }
      return Object.entries(filters).every(([k, v]) => String(item[k]) === v)
    })

    if (sort) {
      this.filteredCache.sort((a, b) => {
        const aVal = String(a[sort] || '')
        const bVal = String(b[sort] || '')
        const cmp  = aVal.localeCompare(bVal, undefined, { numeric: true })
        return dir === 'asc' ? cmp : -cmp
      })
    }

    this.page = 1
    this.renderPage()
  }

  /**
   * Debounce para input de busca.
   */
  debounce(fn, ms = 300) {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => fn(...args), ms)
    }
  }

  /**
   * Anexa eventos de UI para busca, sort, favoritos e filtros.
   */
  attachEvents() {
    this.$search?.addEventListener('input', this.debouncedFilter)
    this.$sortSelect?.addEventListener('change', () => this.applyFilters())
    this.$sortDirBtn?.addEventListener('click', () => {
      const dir = this.$sortDirBtn.dataset.dir === 'asc' ? 'desc' : 'asc'
      this.$sortDirBtn.dataset.dir = dir
      this.applyFilters()
    })
    this.$favBtn?.addEventListener('click', () => {
      const pressed = this.$favBtn.getAttribute('aria-pressed') === 'true'
      this.$favBtn.setAttribute('aria-pressed', String(!pressed))
      this.applyFilters()
    })
    this.$moreBtn?.addEventListener('click', () => {
      this.page++
      this.renderPage()
    })
    ;(this.cfg.toolbar.filters || []).forEach(f => {
      document.getElementById(f.id)
        ?.addEventListener('change', () => this.applyFilters())
    })
  }

  /**
   * Inicializa listagem:
   * - Skeleton UI
   * - Carrega dados e valida streams
   * - Popula filtros, renderiza e anexa eventos
   */
  async init() {
    // Skeleton cards
    this.$container.innerHTML = Array(8).fill().map(() => `
      <div class="card skel">
        <div class="skel-img"></div>
        <div class="skel-line short"></div>
        <div class="skel-line"></div>
      </div>
    `).join('')

    try {
      let list = await loadMasterList()
      list = list.filter(item => item.type === this.cfg.type)

      // Valida streams se definida
      if (typeof validateStream === 'function') {
        const settled = await Promise.allSettled(
          list.map(item => validateStream(item))
        )
        list = settled.map((res, i) => {
          if (res.status === 'fulfilled' && res.value.online) {
            return { ...list[i], ...res.value }
          }
          return null
        }).filter(Boolean)
      }

      this.itemsCache = list
      if (!list.length) {
        this.$container.innerHTML = `
          <p class="tip">
            Nenhum ${escapeHtml(this.cfg.type)} disponível.
          </p>`
        this.updateCounts(0)
        return
      }

      this.cfg.populateFilters?.(list)
      this.applyFilters()
      this.attachEvents()
    } catch (err) {
      console.error('[ListView] init error:', err)
      this.$container.innerHTML = `
        <p class="tip">
          Falha ao carregar ${escapeHtml(this.cfg.type)}.
        </p>`
      this.updateCounts(0)
      showToast('Erro ao carregar lista. Tente novamente.', { type: 'error' })
    }
  }
}
