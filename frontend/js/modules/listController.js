// assets/js/modules/listController.js
import { applyTheme, toggleTheme } from './themeManager.js';
import { normalize, escapeHtml, escapeRegExp, OC } from '../oc-utils.js';

/**
 * Inicializa filtros, ordenação, favoritos e modos de visualização
 * para listas de IPTV, VOD, Rádio ou Webcams.
 *
 * @param {{ type: string }} options
 * @param {string} options.type — Identificador de categoria (ex.: "iptv", "vod")
 */
export function initListController({ type }) {
  console.group(`[OmniCast] List Controller — ${type}`);

  //── Estado interno ────────────────────────────────────────────────
  const state = {
    search: '',
    category: '',
    itemType: '',
    favOnly: false,
    sortField: 'title',
    sortDir: 'asc',
    viewMode: document.body.dataset.viewMode || 'normal'
  };

  //── Referências ao DOM ────────────────────────────────────────────
  const refs = {
    searchInput:    document.getElementById('search-input'),
    categorySelect: document.getElementById('filter-category'),
    typeSelect:     document.getElementById('filter-type'),
    favToggle:      document.getElementById('filter-favorites'),
    sortSelect:     document.getElementById('sort-select'),
    sortDirBtn:     document.getElementById('sort-direction'),
    viewModeBtns:   document.querySelectorAll('[data-view-mode]'),
    grid:           document.getElementById('grid'),
    emptyState:     document.getElementById('empty-state'),
    clearCacheBtn:  document.getElementById('clear-cache'),
    resetConfigBtn: document.getElementById('reset-config'),
    aboutBtn:       document.getElementById('about-btn')
  };

  //── Carrega favoritos do localStorage ou de OC utilitário ───────────
  const favKey    = `favs-${type}`;
  const stored    = JSON.parse(localStorage.getItem(favKey) || '[]');
  const favorites = new Set(OC.getFavorites?.(type) || stored);

  //── Extrai e normaliza os cards iniciais ──────────────────────────
  const items = Array.from(refs.grid?.querySelectorAll('.card') || []).map(card => ({
    el:       card,
    title:    normalize(card.dataset.title || ''),
    category: card.dataset.category || '',
    type:     card.dataset.type || '',
    id:       card.dataset.id || ''
  }));

  //── Debounce simples para não disparar o filtro a cada tecla instantânea
  function debounce(fn, delay = 150) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  //── Aplica filtros, ordena e reanexa os cards ao grid ────────────
  const render = () => {
    if (!refs.grid) return;
    const frag = document.createDocumentFragment();

    // Filtragem
    const filtered = items.filter(item => {
      if (state.search && !item.title.includes(normalize(state.search))) return false;
      if (state.category && item.category !== state.category)       return false;
      if (state.itemType && item.type !== state.itemType)           return false;
      if (state.favOnly && !favorites.has(item.id))                 return false;
      return true;
    });

    // Ordenação
    const sorted = filtered.sort((a, b) => {
      const va = a[state.sortField] || '';
      const vb = b[state.sortField] || '';
      return state.sortDir === 'asc'
        ? va.localeCompare(vb, undefined, { numeric: true })
        : vb.localeCompare(va, undefined, { numeric: true });
    });

    // Monta no DOM
    sorted.forEach(item => frag.appendChild(item.el));
    refs.grid.innerHTML = '';
    refs.grid.appendChild(frag);

    // Empty state
    if (refs.emptyState) {
      refs.emptyState.hidden = sorted.length > 0;
    }
  };

  const run = debounce(render);

  //── Liga eventos de UI aos handlers ──────────────────────────────
  refs.searchInput?.addEventListener('input', e => {
    state.search = e.target.value;
    run();
  });

  refs.categorySelect?.addEventListener('change', e => {
    state.category = e.target.value;
    run();
  });

  refs.typeSelect?.addEventListener('change', e => {
    state.itemType = e.target.value;
    run();
  });

  refs.favToggle?.addEventListener('change', e => {
    state.favOnly = e.target.checked;
    run();
  });

  refs.sortSelect?.addEventListener('change', e => {
    state.sortField = e.target.value;
    run();
  });

  refs.sortDirBtn?.addEventListener('click', () => {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    run();
  });

  refs.viewModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.viewMode = btn.dataset.viewMode;
      document.body.dataset.viewMode = state.viewMode;
    });
  });

  //── Marca/desmarca favoritos via clique no card ─────────────────
  refs.grid?.addEventListener('click', e => {
    const btn = e.target.closest('[data-fav-btn]');
    if (!btn) return;

    const id = btn.dataset.id;
    if (favorites.has(id)) {
      favorites.delete(id);
      btn.classList.remove('active');
      OC.removeFavorite?.(type, id);
    } else {
      favorites.add(id);
      btn.classList.add('active');
      OC.addFavorite?.(type, id);
    }
    localStorage.setItem(favKey, JSON.stringify([...favorites]));
    if (state.favOnly) run();
  });

  //── Atalhos de teclado para busca, tema e favoritos ──────────────
  document.addEventListener('keydown', e => {
    if (e.key === '/') {
      e.preventDefault();
      refs.searchInput?.focus();
    }
    if (e.key.toLowerCase() === 't') {
      toggleTheme();
    }
    if (e.key.toLowerCase() === 'f') {
      state.favOnly = !state.favOnly;
      if (refs.favToggle) refs.favToggle.checked = state.favOnly;
      run();
    }
    if (e.key === 'Escape') {
      state.search = '';
      if (refs.searchInput) refs.searchInput.value = '';
      run();
    }
  });

  //── Limpa cache, reseta config e abre “Sobre” ────────────────────
  refs.clearCacheBtn?.addEventListener('click', () => {
    if (confirm('Limpar cache local?')) {
      OC.clearCache?.(type);
      location.reload();
    }
  });

  refs.resetConfigBtn?.addEventListener('click', () => {
    if (confirm('Repor configurações?')) {
      OC.resetConfig?.();
      location.reload();
    }
  });

  refs.aboutBtn?.addEventListener('click', () => {
    OC.showAbout?.();
  });

  //── Inicialização: aplica o tema e executa a primeira renderização
  applyTheme(OC.getConfig?.().tema);
  render();

  console.groupEnd();
}
