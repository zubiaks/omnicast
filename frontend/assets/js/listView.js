const listView = (() => {
  let config = {};
  let itemsCache = [];
  let filteredCache = [];
  let favs = new Set();
  let page = 1;
  let ioMore = null;

  const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const setCounts = (show, total) => {
    if (config.toolbar.countsId) {
      const el = document.getElementById(config.toolbar.countsId);
      if (el) el.textContent = `A mostrar ${show} de ${total}`;
    }
  };

  const getState = () => {
    const s = { q: '', sort: '', sortDir: 'asc', onlyFavs: false, filters: {} };
    if (config.toolbar.searchId) s.q = (document.getElementById(config.toolbar.searchId)?.value || '').toLowerCase();
    if (config.toolbar.sortId) s.sort = document.getElementById(config.toolbar.sortId)?.value || '';
    if (config.toolbar.sortDirId) s.sortDir = document.getElementById(config.toolbar.sortDirId)?.dataset.dir || 'asc';
    if (config.toolbar.favBtnId) s.onlyFavs = document.getElementById(config.toolbar.favBtnId)?.getAttribute('aria-pressed') === 'true';
    if (config.toolbar.filters) config.toolbar.filters.forEach(f => s.filters[f.key] = document.getElementById(f.id)?.value || '');
    return s;
  };

  const applyFilters = () => {
    const { q, sort, sortDir, onlyFavs, filters } = getState();
    let list = itemsCache.filter(it => {
      if (onlyFavs && !favs.has(it.id)) return false;
      if (q) {
        const hay = `${it.name} ${it.country || ''} ${it.category || ''} ${it.city || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      for (const key in filters) {
        if (filters[key] && it[key] !== filters[key]) return false;
      }
      return true;
    });

    if (sort) {
      list.sort((a, b) => {
        const res = (a[sort] || '').toString().localeCompare((b[sort] || '').toString());
        return (sortDir === 'asc') ? res : -res;
      });
    }

    filteredCache = list;
    page = 1;
    renderPage();
  };

  const renderPage = () => {
    const total = filteredCache.length;
    const pageSize = config.pageSize || total;
    const end = pageSize ? page * pageSize : total;
    const slice = filteredCache.slice(0, end);
    const cont = document.getElementById(config.containerId);

    if (!slice.length) {
      cont.innerHTML = `<p class="tip">${config.emptyMessage || 'Nenhum item encontrado.'}</p>`;
      setCounts(0, itemsCache.length);
      return;
    }

    cont.innerHTML = slice.map((it, idx) => config.card(it, idx, favs.has(it.id))).join('');
    OC.applyImgFallback(cont);
    setCounts(slice.length, itemsCache.length);

    const hasMore = end < total;
    const moreBtn = document.getElementById(config.moreBtnId || '');
    if (moreBtn) moreBtn.style.display = hasMore && config.paginationMode === 'button' ? 'inline-block' : 'none';

    if (ioMore) ioMore.disconnect();
    if (hasMore && config.paginationMode === 'infinite' && config.sentinelId && 'IntersectionObserver' in window) {
      ioMore = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { page++; renderPage(); }
        });
      }, { rootMargin: '200px' });
      ioMore.observe(document.getElementById(config.sentinelId));
    }
  };

  const attachEvents = () => {
    if (config.toolbar.searchId) document.getElementById(config.toolbar.searchId)?.addEventListener('input', debounce(applyFilters, 250));
    if (config.toolbar.filters) config.toolbar.filters.forEach(f => document.getElementById(f.id)?.addEventListener('change', applyFilters));
    if (config.toolbar.sortId) document.getElementById(config.toolbar.sortId)?.addEventListener('change', applyFilters);
    if (config.toolbar.sortDirId) document.getElementById(config.toolbar.sortDirId)?.addEventListener('click', () => {
      const btn = document.getElementById(config.toolbar.sortDirId);
      btn.dataset.dir = btn.dataset.dir === 'asc' ? 'desc' : 'asc';
      applyFilters();
    });
    if (config.toolbar.favBtnId) document.getElementById(config.toolbar.favBtnId)?.addEventListener('click', () => {
      const btn = document.getElementById(config.toolbar.favBtnId);
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      applyFilters();
    });
    if (config.moreBtnId) document.getElementById(config.moreBtnId)?.addEventListener('click', () => { page++; renderPage(); });

    window.addEventListener('storage', (e) => {
      if (e.key === 'oc:favs') { favs = OCFavs.loadFavs(); applyFilters(); }
    });
  };

  const init = async (cfg) => {
    config = cfg;
    favs = OCFavs.loadFavs();

    const cont = document.getElementById(config.containerId);
    cont.innerHTML = Array.from({ length: 8 }).map(() => `
      <div class="card">
        <div class="skel" style="height:140px;border-radius:10px;margin-bottom:12px;"></div>
        <div class="skel" style="height:18px;margin:8px 0;"></div>
        <div class="skel" style="height:14px;width:70%;"></div>
      </div>
    `).join('');

    try {
      let data;
      try {
        const res = await fetch('../assets/data/master_list.json?_=' + Date.now());
        data = await res.json();
      } catch {
        console.warn(`Falha ao carregar lista principal (${config.type}), a usar backup.`);
        try {
          const res = await fetch(`../assets/data/${config.type}_backup.json`);
          data = await res.json();
        } catch (err) {
          console.error(`Falha ao carregar backup de ${config.type}:`, err);
          cont.innerHTML = `<p class="tip">Não foi possível carregar ${config.type}.</p>`;
          setCounts(0, 0);
          return;
        }
      }

      let loadedItems = data.filter(x => x.type === config.type);

      if (typeof config.validateItem === 'function') {
        const results = await Promise.allSettled(loadedItems.map(config.validateItem));
        const online = [];
        const offline = [];
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value.online !== false) {
            online.push(r.value);
          } else if (r.status === 'fulfilled') {
            offline.push(r.value);
          }
        });
        if (offline.length) {
          console.group(`${config.type} offline (${offline.length})`);
          offline.forEach(c => console.warn(`${c.name}: ${c.motivo}`));
          console.groupEnd();
        }
        itemsCache = online;
      } else {
        itemsCache = loadedItems;
      }

      if (!itemsCache.length) {
        cont.innerHTML = `<p class="tip">Nenhum ${config.type} disponível.</p>`;
        setCounts(0, 0);
        return;
      }

      config.populateFilters?.(itemsCache);
      applyFilters();
    } catch (err) {
      console.error(`Erro ao carregar ${config.type}`, err);
      if (config.toolbar.countsId) document.getElementById(config.toolbar.countsId).textContent = 'Não foi possível carregar.';
      cont.innerHTML = `<p class="tip">Falha ao carregar.</p>`;
    }

    attachEvents();

    window.LV = {
      play: (idx) => { const it = filteredCache[idx]; if (it) playItem(it); }
    };
  };

  return { init };
})();
