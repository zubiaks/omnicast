// assets/js/pages/vod.js

import { loadConfig } from '../modules/configManager.js';
import { ListView } from '../modules/listView.js';
import { validarStream } from '../modules/validator-core.js';
import { initPlayerModal } from '../modules/player.js';
import { toggleFavorite } from '../modules/favorites.js';
import { buildCandidates, getFallback, applyImgFallback } from '../modules/ocUtils.js';

/**
 * Inicializa a página de VOD:
 * - Lista paginada com busca, filtros por categoria e favoritos
 * - Validação de streams antes de incluir no listing
 * - Player modal para reprodução de vídeo
 */
export async function initVODPage() {
  const cfg = loadConfig();
  // Prepara player modal e expõe playItem para handlers de card
  const { playItem } = initPlayerModal({ maxRetries: cfg.playerMaxRetries });

  // Cria e configura ListView
  const view = new ListView({
    type: 'vod',
    containerId: 'vod-container',
    toolbar: {
      searchId: 'vod-search',
      sortId: 'vod-sort',
      sortDirId: 'vod-sort-dir',
      favBtnId: 'vod-favs',
      countsId: 'vod-counts',
      filters: [
        { id: 'vod-category', key: 'category' }
      ]
    },
    // VOD traz muitos itens, sem button “Mais” (página única)
    pageSize: Infinity,
    paginationMode: 'button',
    emptyMessage: 'Nenhum título encontrado com os filtros atuais.',

    // Filtra offline/online e anexa campo `online`
    validateItem(item) {
      const url = item.stream_url || item.urls?.stream;
      return validarStream(url).then(res => ({ ...item, online: res.online }));
    },

    // Popula <select> de categoria
    populateFilters(items) {
      const select = document.getElementById('vod-category');
      const cats = [...new Set(items.map(i => i.category).filter(Boolean))].sort();
      select.innerHTML = [
        `<option value="">Todas as categorias</option>`,
        ...cats.map(c => `<option value="${c}">${c}</option>`)
      ].join('');
    },

    // Gera HTML de cada card VOD
    card(item, idx, isFav) {
      const name       = item.name || 'Sem título';
      const candidates = buildCandidates(item).join('|');
      const fallback   = getFallback('vod');
      const category   = item.category ? ` — ${item.category}` : '';
      return `
        <div class="vod-card" tabindex="0" title="${name}">
          <img
            data-candidates="${candidates}"
            data-fallback="${fallback}"
            alt="${name}${category}"
            loading="lazy"
          >
          <h3>${isFav ? '★ ' : ''}${name}</h3>
          <div class="actions" data-idx="${idx}">
            <button class="btn btn-play" style="background:var(--vod)" data-action="play">
              Assistir
            </button>
            <button class="btn btn-fav" style="background:${isFav ? '#f59e0b' : '#374151'}" data-action="fav">
              ${isFav ? '★' : '☆'} Favorito
            </button>
          </div>
        </div>
      `;
    },

    // Associa os eventos de play e favorito em cada render
    afterRender() {
      const container = document.getElementById('vod-container');
      applyImgFallback(container);

      container.querySelectorAll('.actions').forEach(div => {
        const idx  = Number(div.dataset.idx);
        const item = view.filteredCache[idx];

        // Play abre modal e monta player
        div.querySelector('[data-action="play"]')
           .addEventListener('click', () => playItem(item));

        // Toggle favorito e reaplica filtros para atualizar UI
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

// Auto‐bootstrap quando houver container VOD
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('vod-container')) {
    initVODPage();
  }
});
