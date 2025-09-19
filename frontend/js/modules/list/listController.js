// frontend/js/modules/list/listController.js

import { loadConfig, updateConfig, resetConfig } from '@modules/config'
import { applyTheme, toggleTheme, showToast }    from '@modules/ui'
import { normalize, debounce }                   from '@modules/utils'
import {
  isFavorite,
  toggleFavorite,
  getFavoriteIds
}                                               from '@modules/media'

/**
 * Inicializa o controlador de listas (IPTV, VOD, Rádio, Webcams).
 *
 * @param {{ type: string }} options
 * @param {string} options.type
 *   Identificador da categoria (ex.: "iptv", "vod").
 * @param {Document|HTMLElement} [root=document]
 *   Raiz do DOM onde estão os elementos da lista.
 * @returns {() => void}
 *   Função de cleanup para remover listeners e evitar vazamentos.
 */
export function initListController({ type }, root = document) {
  console.group(`[ListController] ${type}`)

  // Estado inicial e configuração
  const cfg = loadConfig()
  const state = {
    search:    '',
    category:  '',
    itemType:  '',
    favOnly:   false,
    sortField: 'title',
    sortDir:   'asc',
    viewMode:  cfg.viewmode
  }

  // Referências DOM
  const refs = {
    searchInput:    root.getElementById('search-input'),
    categorySelect: root.getElementById('filter-category'),
    typeSelect:     root.getElementById('filter-type'),
    favToggle:      root.getElementById('filter-favorites'),
    sortSelect:     root.getElementById('sort-select'),
    sortDirBtn:     root.getElementById('sort-direction'),
    viewModeBtns:   root.querySelectorAll('[data-view-mode]'),
    grid:           root.getElementById('grid'),
    emptyState:     root.getElementById('empty-state'),
    clearCacheBtn:  root.getElementById('clear-cache'),
    resetConfigBtn: root.getElementById('reset-config'),
    aboutBtn:       root.getElementById('about-btn')
  }

  // Conjunto de favoritos atual
  let favoritesSet = new Set(getFavoriteIds())

  // Coleta e normaliza os cards iniciais
  const items = Array.from(refs.grid?.querySelectorAll('.card') || [])
    .map(card => {
      const id = card.dataset.id || ''
      const favBtn = card.querySelector('[data-fav-btn]')
      if (favBtn) favBtn.classList.toggle('active', favoritesSet.has(id))

      return {
        el:       card,
        title:    normalize(card.dataset.title  || ''),
        category: card.dataset.category       || '',
        type:     card.dataset.type           || '',
        id
      }
    })

  // Renderização principal: filtra, ordena e atualiza DOM
  function render() {
    if (!refs.grid) return

    // Filtragem
    const filtered = items.filter(item => {
      if (state.search && !item.title.includes(normalize(state.search))) return false
      if (state.category && item.category !== state.category)       return false
      if (state.itemType && item.type !== state.itemType)           return false
      if (state.favOnly && !favoritesSet.has(item.id))              return false
      return true
    })

    // Ordenação
    const sorted = filtered.sort((a, b) => {
      const va = a[state.sortField] || ''
      const vb = b[state.sortField] || ''
      return state.sortDir === 'asc'
        ? va.localeCompare(vb, undefined, { numeric: true })
        : vb.localeCompare(va, undefined, { numeric: true })
    })

    // Atualiza grid
    refs.grid.innerHTML = ''
    const frag = document.createDocumentFragment()
    sorted.forEach(item => frag.appendChild(item.el))
    refs.grid.appendChild(frag)

    // Estado vazio
    if (refs.emptyState) {
      refs.emptyState.hidden = sorted.length > 0
    }
  }

  const debouncedRender = debounce(render, 150)

  // Coleção de listeners para cleanup
  const listeners = []
  function on(el, event, handler) {
    el?.addEventListener(event, handler)
    listeners.push({ el, event, handler })
  }

  // Handlers de UI
  on(refs.searchInput, 'input', e => {
    state.search = e.target.value
    debouncedRender()
  })

  on(refs.categorySelect, 'change', e => {
    state.category = e.target.value
    debouncedRender()
  })

  on(refs.typeSelect, 'change', e => {
    state.itemType = e.target.value
    debouncedRender()
  })

  on(refs.favToggle, 'change', e => {
    state.favOnly = e.target.checked
    debouncedRender()
  })

  on(refs.sortSelect, 'change', e => {
    state.sortField = e.target.value
    debouncedRender()
  })

  on(refs.sortDirBtn, 'click', () => {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
    debouncedRender()
  })

  // Modo de visualização
  refs.viewModeBtns.forEach(btn => {
    on(btn, 'click', () => {
      const vm = btn.dataset.viewMode
      state.viewMode = vm
      document.body.dataset.viewMode = vm
      updateConfig('viewmode', vm)
    })
  })

  // Favoritos via delegated click
  on(refs.grid, 'click', e => {
    const btn = e.target.closest('[data-fav-btn]')
    if (!btn) return

    const id  = btn.dataset.id
    const now = toggleFavorite(id)
    favoritesSet = new Set(getFavoriteIds())
    btn.classList.toggle('active', now)
    if (state.favOnly) debouncedRender()
  })

  // Atalhos de teclado
  on(document, 'keydown', e => {
    if (e.key === '/') {
      e.preventDefault()
      refs.searchInput?.focus()
    }
    if (e.key.toLowerCase() === 't') {
      toggleTheme()
      applyTheme(loadConfig().tema)
    }
    if (e.key.toLowerCase() === 'f') {
      state.favOnly = !state.favOnly
      if (refs.favToggle) refs.favToggle.checked = state.favOnly
      debouncedRender()
    }
    if (e.key === 'Escape') {
      state.search = ''
      if (refs.searchInput) refs.searchInput.value = ''
      debouncedRender()
    }
  })

  // Limpar cache local e recarregar
  on(refs.clearCacheBtn, 'click', () => {
    if (confirm('Limpar cache local?')) {
      localStorage.clear()
      showToast('Cache limpo, recarregando...', { type: 'info' })
      location.reload()
    }
  })

  // Resetar configurações globais
  on(refs.resetConfigBtn, 'click', () => {
    if (confirm('Repor configurações para o padrão?')) {
      resetConfig()
      location.reload()
    }
  })

  // Abre modal “Sobre”
  on(refs.aboutBtn, 'click', () => {
    document.dispatchEvent(new CustomEvent('openAbout'))
  })

  // Primeira renderização
  render()

  console.groupEnd()

  // Retorna função de cleanup
  return () => {
    listeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler)
    })
    listeners.length = 0
  }
}
