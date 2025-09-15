// frontend/js/home.js
import { loadConfig }             from './modules/configManager.js';
import { loadMasterList }         from './modules/dataService.js';
import { validarStream }          from './modules/validator-core.js';
import {
  getFavoriteIds,
  countFavoritesByType
}                                 from './modules/favorites.js';
import { showToast }              from './modules/alerts.js';

document.addEventListener('DOMContentLoaded', async () => {
  const CACHE_KEY = 'oc:master';
  const TYPES     = ['iptv', 'webcam', 'vod', 'radio'];

  const cfg  = loadConfig();
  document.documentElement.dataset.theme = cfg.tema;
  if (cfg.viewmode) document.body.classList.add(cfg.viewmode);

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  // disparar eventos para o header reagir
  const capitalize = s => s[0].toUpperCase() + s.slice(1);
  document.dispatchEvent(new CustomEvent('oc:theme-changed', {
    detail: cfg.tema === 'dark' ? 'Escuro' : 'Claro'
  }));
  document.dispatchEvent(new CustomEvent('oc:viewmode-changed', {
    detail: cfg.viewmode ? capitalize(cfg.viewmode) : 'Normal'
  }));

  // fetch principal + fallback
  async function fetchData() {
    try {
      return await loadMasterList();
    } catch {
      showToast('Master list falhou, carregando backup...', 'warning');
      const res = await fetch('/data/home_backup.json');
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    }
  }

  // conta online ou total
  async function countOnline(arr) {
    if (!cfg.validateStreams) return arr.length;
    const settled = await Promise.allSettled(
      arr.map(i => validarStream(i.urls?.stream || i.stream_url))
    );
    return settled.filter(r => r.status === 'fulfilled' && r.value.online).length;
  }

  // atualiza DOM
  async function updateCounts(data) {
    try {
      const counts = await Promise.all(
        TYPES.map(type => countOnline(data.filter(i => i.type === type)))
      );
      TYPES.forEach((t, i) => setText(`${t}-count`, counts[i]));
    } catch (e) {
      console.error('[home] updateCounts', e);
      showToast('Erro ao atualizar contadores.', 'error');
    }
  }

  // favoritos
  function updateFavCounts(data) {
    const favs = new Set(getFavoriteIds());
    const byType = countFavoritesByType(data, favs);
    TYPES.forEach(t => setText(`fav-count-${t}`, byType[t] || 0));
  }

  // placeholders
  TYPES.forEach(t => setText(`${t}-count`, '…'));
  TYPES.forEach(t => setText(`fav-count-${t}`, '…'));

  // tenta cache
  let master = [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr)) {
      master = arr;
      await updateCounts(master);
      updateFavCounts(master);
    }
  } catch {
    console.warn('[home] cache inválido');
  }

  // dados frescos
  try {
    master = await fetchData();
    if (!Array.isArray(master) || master.length === 0) {
      TYPES.forEach(t => setText(`${t}-count`, 'Offline'));
      return;
    }
    await updateCounts(master);
    updateFavCounts(master);
    localStorage.setItem(CACHE_KEY, JSON.stringify(master));
  } catch (e) {
    console.error('[home] fetchData', e);
    showToast('Erro ao carregar dados da home.', 'error');
    TYPES.forEach(t => setText(`${t}-count`, 'Erro'));
  }

  // sync favorites em outras abas
  window.addEventListener('storage', e => {
    if (e.key === CACHE_KEY) {
      const arr = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      if (Array.isArray(arr)) updateFavCounts(arr);
    }
  });
});
