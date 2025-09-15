// assets/js/pages/iptv.js

import { loadConfig } from '../modules/configManager.js';
import { ListView } from '../modules/listView.js';
import { validarStream } from '../modules/validator-core.js';
import { initPlayerModal } from '../modules/player.js';
import { toggleFavorite } from '../modules/favorites.js';
import { buildCandidates, getFallback, applyImgFallback } from '../modules/ocUtils.js';

/**
 * Inicializa a página de IPTV:
 * - Lista infinita com filtros por país/categoria
 * - Validação de streams via validarStream
 * - Favoritos e reprodução em modal
 */
export async function initIPTVPage() {
  const cfg = loadConfig();
  const { playItem } = initPlayerModal({ maxRetries: cfg.playerMaxRetries });

  const view = new ListView({
    type: 'iptv',
    containerId: 'iptv-grid',
    toolbar: {
      searchId:  'iptv-search',
      sortId:    'iptv-sort',
      sortDirId: 'iptv-sort-dir',
      favBtnId:  'iptv-favs',
      countsId:  'iptv-counts',
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

    // Marca cada item com { ...item, online } via validarStream
    validateItem(item) {
      const url = item.stream_url || item.urls?.stream;
      return validarStream(url).then(res => ({ ...item, online: res.online }));
    },

    // Popula selects de país e categoria dinamicamente
    populateFilters(items) {
      const countryEl  = document.getElementById('iptv-country');
      const categoryEl = document.getElementById('iptv-category');

      const countries  = [...new Set(items.map(i => i.country).filter(Boolean))].sort();
      countryEl.innerHTML = [
        `<option value="">Todos os países</option>`,
        ...countries.map(c => `<option value="${c}">${c}</option>`)
      ].join('');

      const categories = [...new Set(items.map(i => i.category).filter(Boolean))].sort();
      categoryEl.innerHTML = [
        `<option value="">Todas as categorias</option>`,
        ...categories.map(c => `<option value="${c}">${c}</option>`)
      ].join('');

      countryEl.addEventListener('change', () => {
        const sel = countryEl.value;
        const pool = sel ? items.filter(i => i.country === sel) : items;
        const cats = [...new Set(pool.map(i => i.category).filter(Boolean))].sort();
        categoryEl.innerHTML = [
          `<option value="">Todas as categorias</option>`,
          ...cats.map(c => `<option value="${c}">${c}</option>`)
        ].join('');
      });
    },

    // Gera markup da card usando fallbacks de imagem e cor de borda
    card(item, idx, isFav) {
      const candidates = buildCandidates(item).join('|');
      const fallback   = getFallback('iptv');
      const place      = [item.country, item.category].filter(Boolean).join(' • ');
      return `
        <div class="card" style="border-top:4px solid var(--iptv)">
          <img
            data-candidates="${candidates}"
            data-fallback="${fallback}"
            alt="${item.name}${place ? ' — ' + place : ''}"
            loading="lazy"
          >
          <h2>${item.name}</h2>
          <p>${place}</p>
          <div class="actions" data-idx="${idx}">
            <button class="btn btn-play" style="background:var(--iptv)" data-action="play">
              Play
            </button>
            <button class="btn btn-fav" style="background:${isFav ? '#f59e0b' : '#374151'}" data-action="fav">
              ${isFav ? '★' : '☆'} Favorito
            </button>
          </div>
        </div>
      `;
    },

    // Após renderizar, configura lazy‐load de imagens e eventos de play/fav
    afterRender() {
      const container = document.getElementById('iptv-grid');
      applyImgFallback(container);

      container.querySelectorAll('.actions').forEach(div => {
        const idx  = Number(div.dataset.idx);
        const item = view.filteredCache[idx];

        div.querySelector('[data-action="play"]')
           .addEventListener('click', () => playItem(item));

        div.querySelector('[data-action="fav"]')
           .addEventListener('click', () => {
             toggleFavorite(item.id);
             view.applyFilters();
           });
      });
    }
  });

  await view.init();
}

// Auto‐bootstrap quando o container existir
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('iptv-grid')) {
    initIPTVPage();
  }
});
