// assets/js/pages/favorites.js

import { loadConfig } from '../modules/configManager.js';
import { initPlayerModal } from '../modules/player.js';
import { ListView } from '../modules/listView.js';
import { validarStream } from '../modules/validator-core.js';
import { getFavoriteIds, toggleFavorite } from '../modules/favorites.js';
import { buildCandidates, getFallback, applyImgFallback } from '../modules/ocUtils.js';
import { showToast } from '../modules/alerts.js';

/**
 * Inicializa a página de Favoritos:
 * - Carrega IDs de favoritos e filtra lista mestra
 * - Valida streams online/offline
 * - Renderiza cards com ListView genérico
 * - Filtra por tipo via botões externos
 */
export async function initFavoritesPage() {
  const cfg       = loadConfig();
  const favIds    = getFavoriteIds();
  const countEl   = document.getElementById('fav-count');
  const gridEl    = document.getElementById('favorites-grid');
  const btns      = {
    all:      document.getElementById('btn-show-all'),
    channels: document.getElementById('btn-show-channels'),
    vod:      document.getElementById('btn-show-vod'),
    radio:    document.getElementById('btn-show-radio')
  };
  const typeMap   = { all: null, channels: 'iptv', vod: 'vod', radio: 'radio' };

  if (!gridEl || !countEl) {
    console.warn('[favorites] Elementos não encontrados.');
    return;
  }

  // 1) Carrega master list com fallback
  let master;
  try {
    const res = await fetch(`/data/master_list.json?_=${Date.now()}`);
    if (!res.ok) throw new Error(res.statusText);
    master = await res.json();
  } catch {
    showToast('Falha ao carregar lista principal, usando backup.', 'warning');
    try {
      const res = await fetch('/data/favoritos_backup.json');
      master = await res.json();
    } catch (err) {
      showToast('Erro ao carregar lista de favoritos.', 'error');
      console.error('[favorites]', err);
      return;
    }
  }

  // 2) Filtra apenas favoritos com stream_url
  let items = Array.isArray(master)
    ? master.filter(i => favIds.includes(i.id) && i.stream_url)
    : [];
  if (!items.length) {
    countEl.textContent = '0';
    gridEl.innerHTML = `<p class="tip">Nenhum favorito encontrado.</p>`;
    return;
  }

  // 3) Valida streams e separa online/offline
  const settled = await Promise.allSettled(
    items.map(item => validarStream(item))
  );
  const online = settled
    .filter(r => r.status === 'fulfilled' && r.value.online)
    .map(r => ({ ...items.find(i => i.id === r.value.id), ...r.value }));
  const offline = settled
    .filter(r => r.status === 'fulfilled' && !r.value.online)
    .map(r => r.value);

  if (offline.length) {
    console.group(`[favorites] Offline (${offline.length})`);
    offline.forEach(r => console.warn(`${r.name}: ${r.motivo}`));
    console.groupEnd();
  }

  // 4) Prepara modal de reprodução
  const { playItem } = initPlayerModal({ maxRetries: cfg.playerMaxRetries });

  // 5) Instancia ListView para exibir favoritos online
  const view = new ListView({
    type: 'favoritos',
    containerId: 'favorites-grid',
    toolbar: null,             // sem toolbar interna
    pageSize: Infinity,        // tudo numa página
    paginationMode: 'button',
    emptyMessage: 'Nenhum favorito disponível.',
    card(item, idx, isFav) {
      const candidates = buildCandidates(item).join('|');
      const fallback   = getFallback(item.type);
      const colorVar   = `var(--${item.type})`;
      return `
        <div class="card fav-card" style="border-top:4px solid ${colorVar}">
          <img
            data-candidates="${candidates}"
            data-fallback="${fallback}"
            alt="${item.name}"
            loading="lazy"
          >
          <h2>${item.name}</h2>
          <p>${item.type.toUpperCase()}</p>
          <div class="actions" data-idx="${idx}">
            <button class="btn btn-play" style="background:${colorVar}" data-action="play">
              Ver
            </button>
            <button class="btn btn-fav" style="background:${isFav ? '#f59e0b' : '#374151'}" data-action="fav">
              ${isFav ? '★' : '☆'} Favorito
            </button>
          </div>
        </div>
      `;
    },
    afterRender() {
      applyImgFallback(gridEl);
      gridEl.querySelectorAll('.actions').forEach(div => {
        const idx  = Number(div.dataset.idx);
        const item = view.filteredCache[idx];

        div.querySelector('[data-action="play"]')
           .addEventListener('click', () => playItem(item));

        div.querySelector('[data-action="fav"]')
           .addEventListener('click', () => {
             toggleFavorite(item.id);
             // atualiza contagem e remove do listing se offline
             const updated = getFavoriteIds().filter(id => id === item.id || favIds.includes(id));
             view.setItems(view.filteredCache.filter(i => updated.includes(i.id)));
             countEl.textContent = String(view.filteredCache.length);
           });
      });
    }
  });

  await view.init();
  view.setItems(online);
  countEl.textContent = String(online.length);

  // 6) Botões de filtro por tipo
  Object.entries(typeMap).forEach(([key, type]) => {
    const btn = btns[key];
    if (!btn) return;

    btn.addEventListener('click', () => {
      const filtered = type
        ? online.filter(i => i.type === type)
        : online;
      view.setItems(filtered);
      countEl.textContent = String(filtered.length);
      Object.values(btns).forEach(b => b?.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Auto‐bootstrap
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('favorites-grid')) {
    initFavoritesPage();
  }
});
