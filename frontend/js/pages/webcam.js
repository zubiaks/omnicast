// assets/js/pages/webcams.js

import { loadConfig } from '../modules/configManager.js';
import { validarStream } from '../modules/validator-core.js';
import { ListView } from '../modules/listView.js';
import { initPlayerModal } from '../modules/player.js';
import { toggleFavorite } from '../modules/favorites.js';
import { buildCandidates, getFallback, applyImgFallback } from '../modules/ocUtils.js';

/**
 * Inicializa a página de Webcams:
 * - Lista infinita com filtros por país/cidade
 * - Validação de stream via HLS/API
 * - Favoritos e play em modal
 */
export async function initWebcamsPage() {
  const cfg = loadConfig();
  const { playItem } = initPlayerModal({ maxRetries: cfg.playerMaxRetries });

  const view = new ListView({
    type: 'webcam',
    containerId: 'webcam-list',
    toolbar: {
      searchId:  'webcam-search',
      sortId:    'webcam-sort',
      sortDirId: 'webcam-sort-dir',
      favBtnId:  'webcam-favs',
      countsId:  'webcam-counts',
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

    // Valida item: anexa propriedade `online`
    validateItem(item) {
      const url = item.stream_url || item.urls?.stream;
      return validarStream(url).then(res => ({
        ...item,
        online: res.online
      }));
    },

    // Preenche selects de país e cidade
    populateFilters(items) {
      const countryEl = document.getElementById('webcam-country');
      const cityEl    = document.getElementById('webcam-city');

      const countries = [...new Set(items.map(i => i.country).filter(Boolean))].sort();
      countryEl.innerHTML = [
        `<option value="">Todos os países</option>`,
        ...countries.map(c => `<option value="${c}">${c}</option>`)
      ].join('');

      countryEl.addEventListener('change', () => {
        const selCountry = countryEl.value;
        const pool = selCountry
          ? items.filter(i => i.country === selCountry)
          : items;
        const cities = [...new Set(pool.map(i => i.city).filter(Boolean))].sort();
        cityEl.innerHTML = [
          `<option value="">Todas as cidades</option>`,
          ...cities.map(c => `<option value="${c}">${c}</option>`)
        ].join('');
      });
    },

    // Gera HTML de cada card de webcam
    card(item, idx, isFav) {
      const candidates = buildCandidates(item).join('|');
      const fallback   = getFallback('webcam');
      const place      = [item.city, item.country].filter(Boolean).join(', ');
      return `
        <div class="card" style="border-top: 4px solid var(--webcam)">
          <img
            data-candidates="${candidates}"
            data-fallback="${fallback}"
            alt="${item.name}${place ? ' — ' + place : ''}"
            loading="lazy"
          >
          <h2>${item.name}</h2>
          <p>${place}</p>
          <div class="actions" data-idx="${idx}">
            <button class="btn btn-play" style="background:var(--webcam)" data-action="play">
              Ver
            </button>
            <button class="btn btn-fav" style="background:${isFav ? '#f59e0b' : '#374151'}" data-action="fav">
              ${isFav ? '★' : '☆'} Favorito
            </button>
          </div>
        </div>
      `;
    },

    // Após cada render, associa eventos de play e favorito
    afterRender() {
      const container = document.getElementById('webcam-list');
      applyImgFallback(container);

      container.querySelectorAll('.actions').forEach(div => {
        const idx = Number(div.dataset.idx);
        const item = view.filteredCache[idx];

        div.querySelector('[data-action="play"]')
           .addEventListener('click', () => playItem(item));

        div.querySelector('[data-action="fav"]')
           .addEventListener('click', () => {
             toggleFavorite(item.id);
             // Reaplica filtros para atualizar botão e contador
             view.applyFilters();
           });
      });
    }
  });

  await view.init();
}

// Auto‐bootstrapping quando houver elemento de webcams
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('webcam-list')) {
    initWebcamsPage();
  }
});
