// assets/js/modules/listView.js
import { loadMasterList } from './dataService.js';
import { validarStream } from './validators/validator-core.js';
import {
  isFavorite,
  toggleFavorite,
  getFavoriteIds
} from './favorites.js';
import {
  normalize,
  escapeRegExp,
  applyImgFallback
} from './ocUtils.js';
import { showToast } from './alerts.js';

/**
 * Lista paginada com filtros, busca, ordenação, favoritos e modos de paginação.
 */
export class ListView {
  /**
   * @param {Object} cfg
   * @param {string} cfg.type                — tipo de item (e.g. 'iptv','vod')
   * @param {string} cfg.containerId         — id do container onde as cards serão renderizadas
   * @param {Object} cfg.toolbar             — IDs e definições do toolbar
   * @param {string} cfg.toolbar.searchId
   * @param {string} cfg.toolbar.sortId
   * @param {string} cfg.toolbar.sortDirId
   * @param {string} cfg.toolbar.favBtnId
   * @param {Array<{ id: string, key: string }>} [cfg.toolbar.filters]
   * @param {string} cfg.moreBtnId           — id do botão “Mostrar mais”
   * @param {string} cfg.sentinelId          — id do elemento sentinel para infinite scroll
   * @param {Function} cfg.card              — fn(item, idx, isFav) retorna HTML da card
   * @param {Function} [cfg.populateFilters] — fn(list) para popular selects de filtro
   * @param {number} [cfg.pageSize=Infinity] — tamanho do bloco por página
   * @param {'button'|'infinite'} [cfg.paginationMode='button']
   * @param {string} [cfg.emptyMessage]      — texto ao não haver itens
   */
  constructor(cfg) {
    this.cfg           = cfg;
    this.itemsCache    = [];
    this.filteredCache = [];
    this.favs          = new Set(getFavoriteIds());
    this.page          = 1;
    this.ioObserver    = null;

    // Seletores do DOM
    this.$container  = document.getElementById(cfg.containerId);
    this.$search     = document.getElementById(cfg.toolbar.searchId);
    this.$sortSelect = document.getElementById(cfg.toolbar.sortId);
    this.$sortDirBtn = document.getElementById(cfg.toolbar.sortDirId);
    this.$favBtn     = document.getElementById(cfg.toolbar.favBtnId);
    this.$moreBtn    = document.getElementById(cfg.moreBtnId);
    this.$sentinel   = document.getElementById(cfg.sentinelId);

    this.debouncedFilter = this.debounce(this.applyFilters.bind(this), 200);

    // Atualiza favoritos em outras abas
    window.addEventListener('storage', e => {
      if (e.key === 'oc:favs') {
        this.favs = new Set(getFavoriteIds());
        this.applyFilters();
      }
    });
  }

  /**
   * Cria um wrapper debounce para funções de input/scroll.
   */
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  /**
   * Lê o estado atual de busca, filtros e favoritos.
   */
  getState() {
    const q        = normalize(this.$search?.value || '');
    const sort     = this.$sortSelect?.value || '';
    const dir      = this.$sortDirBtn?.dataset.dir || 'asc';
    const onlyFavs = this.$favBtn?.getAttribute('aria-pressed') === 'true';
    const filters  = (this.cfg.toolbar.filters || []).reduce((acc, f) => {
      const el = document.getElementById(f.id);
      if (el?.value) acc[f.key] = el.value;
      return acc;
    }, {});
    return { q, sort, dir, onlyFavs, filters };
  }

  /**
   * Atualiza o contador “mostrando X de Y” na toolbar.
   */
  updateCounts(shown) {
    const total = this.itemsCache.length;
    const el    = document.getElementById(this.cfg.toolbar.countsId);
    if (el) el.textContent = `Mostrando ${shown} de ${total}`;
  }

  /**
   * Renderiza as cards da página atual e configura lazy-load/infinite scroll.
   */
  renderPage() {
    const {
      pageSize = Infinity,
      paginationMode = 'button',
      card,
      emptyMessage = 'Nenhum item encontrado.'
    } = this.cfg;

    const end   = this.page * pageSize;
    const slice = this.filteredCache.slice(0, end);

    this.$container.innerHTML = '';
    if (!slice.length) {
      this.$container.innerHTML = `<p class="tip">${escapeHtml(emptyMessage)}</p>`;
      this.updateCounts(0);
      return;
    }

    // Monta fragment com cards
    const frag = document.createDocumentFragment();
    slice.forEach((item, idx) => {
      const html = card(item, idx, this.favs.has(item.id));
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      frag.appendChild(wrapper.firstElementChild);
    });
    this.$container.appendChild(frag);
    applyImgFallback(this.$container);
    this.updateCounts(slice.length);

    // Botão “Mais”
    if (this.$moreBtn) {
      const showMore = paginationMode === 'button' && end < this.filteredCache.length;
      this.$moreBtn.style.display = showMore ? '' : 'none';
    }

    // Infinite scroll
    if (this.ioObserver) this.ioObserver.disconnect();
    if (
      paginationMode === 'infinite' &&
      end < this.filteredCache.length &&
      this.$sentinel
    ) {
      this.ioObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          this.page++;
          this.renderPage();
        }
      }, { rootMargin: '150px' });
      this.ioObserver.observe(this.$sentinel);
    }
  }

  /**
   * Aplica filtros, busca e ordenação ao cache de itens.
   */
  applyFilters() {
    const { q, sort, dir, onlyFavs, filters } = this.getState();
    const termRegex = q ? new RegExp(escapeRegExp(q), 'i') : null;

    this.filteredCache = this.itemsCache.filter(item => {
      if (onlyFavs && !this.favs.has(item.id)) return false;
      if (termRegex) {
        const hay = normalize(`${item.name} ${item.category} ${item.location?.city || ''}`);
        if (!termRegex.test(hay)) return false;
      }
      return Object.entries(filters).every(([k, v]) => String(item[k]) === v);
    });

    if (sort) {
      this.filteredCache.sort((a, b) => {
        const aVal = String(a[sort] || '');
        const bVal = String(b[sort] || '');
        const cmp  = aVal.localeCompare(bVal, undefined, { numeric: true });
        return dir === 'asc' ? cmp : -cmp;
      });
    }

    this.page = 1;
    this.renderPage();
  }

  /**
   * Atacha eventos de toolbar, busca, filtros, favoritos e paginação.
   */
  attachEvents() {
    this.$search?.addEventListener('input', this.debouncedFilter);
    this.$sortSelect?.addEventListener('change', () => this.applyFilters());
    this.$sortDirBtn?.addEventListener('click', () => {
      this.$sortDirBtn.dataset.dir = this.$sortDirBtn.dataset.dir === 'asc' ? 'desc' : 'asc';
      this.applyFilters();
    });
    this.$favBtn?.addEventListener('click', () => {
      const pressed = this.$favBtn.getAttribute('aria-pressed') === 'true';
      this.$favBtn.setAttribute('aria-pressed', String(!pressed));
      this.applyFilters();
    });
    this.$moreBtn?.addEventListener('click', () => {
      this.page++;
      this.renderPage();
    });
    (this.cfg.toolbar.filters || []).forEach(f => {
      document.getElementById(f.id)
        ?.addEventListener('change', () => this.applyFilters());
    });
  }

  /**
   * Carrega dados, filtra por tipo, valida via validarStream e popula tudo.
   */
  async init() {
    // Skeleton initial
    this.$container.innerHTML = Array(8).fill(0).map(() => `
      <div class="card skel">
        <div class="skel-img"></div>
        <div class="skel-line short"></div>
        <div class="skel-line"></div>
      </div>
    `).join('');

    try {
      let list = (await loadMasterList())
        .filter(it => it.type === this.cfg.type);

      if (typeof validarStream === 'function') {
        const settled = await Promise.allSettled(
          list.map(item => validarStream(item))
        );
        list = settled
          .filter(r => r.status === 'fulfilled' && r.value.online)
          .map(r => ({ ...list[settled.indexOf(r)], ...r.value }));
      }

      this.itemsCache = list;
      if (!list.length) {
        this.$container.innerHTML = `<p class="tip">Nenhum ${escapeHtml(this.cfg.type)} disponível.</p>`;
        this.updateCounts(0);
        return;
      }

      this.cfg.populateFilters?.(list);
      this.applyFilters();
      this.attachEvents();
    } catch (err) {
      console.error('[ListView] init error:', err);
      this.$container.innerHTML = `<p class="tip">Falha ao carregar ${escapeHtml(this.cfg.type)}.</p>`;
      this.updateCounts(0);
      showToast('Erro ao carregar lista. Tente novamente.', 'error');
    }
  }
}
