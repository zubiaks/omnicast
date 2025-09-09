import { validarStream } from '../validators/validator-core.js';

listView.init({
  type: 'vod',
  containerId: 'vod-container',
  toolbar: {
    searchId: 'vod-search',
    filters: [
      { id: 'vod-category', key: 'category' }
    ],
    sortId: 'vod-sort',
    sortDirId: 'vod-sort-dir',
    favBtnId: 'vod-favs',
    countsId: 'vod-counts'
  },
  pageSize: 9999,
  paginationMode: 'button',
  emptyMessage: 'Nenhum título encontrado com os filtros atuais.',
  populateFilters: (items) => {
    const categories = [...new Set(items.map(x => x.category).filter(Boolean))].sort();
    document.getElementById('vod-category').innerHTML =
      '<option value="">Todas as categorias</option>' +
      categories.map(c => `<option value="${c}">${c}</option>`).join('');
  },
  card: (it, idx, isFav) => {
    const safeName = it.name || 'Sem título';
    const candidates = OC.buildCandidates(it).join('|');
    const fallback = OC.getFallback('vod');
    return `
      <div class="vod-card" tabindex="0" onclick="playItem(filteredCache[${idx}])" title="${safeName}">
        <img 
          data-type="vod" 
          data-candidates="${candidates}" 
          data-fallback="${fallback}" 
          alt="${safeName}">
        <h3>${isFav ? '★ ' : ''}${safeName}</h3>
      </div>
    `;
  }
});

async function carregarVOD() {
  const countsEl = document.getElementById('vod-counts');

  try {
    let data;
    try {
      const res = await fetch('../assets/data/master_list.json?_=' + Date.now());
      data = await res.json();
    } catch {
      console.warn('Falha ao carregar lista principal de VOD, a usar backup.');
      try {
        const res = await fetch('../assets/data/vod_backup.json');
        data = await res.json();
      } catch (err) {
        console.error('Falha ao carregar backup de VOD:', err);
        countsEl.textContent = 'Não foi possível carregar.';
        return;
      }
    }

    const vodItems = data.filter(x => x.type === 'vod' && x.stream_url);

    if (!vodItems.length) {
      countsEl.textContent = 'Nenhum título disponível.';
      window.itemsCache = [];
      applyFilters?.();
      return;
    }

    const resultados = await Promise.allSettled(vodItems.map(validarStream));

    const offline = [];
    const online = [];

    resultados.forEach(r => {
      if (r.status === 'fulfilled' && r.value.online) {
        online.push(r.value);
      } else if (r.status === 'fulfilled') {
        offline.push(r.value);
      }
    });

    console.group(`VOD offline (${offline.length})`);
    offline.forEach(c => console.warn(`${c.name}: ${c.motivo}`));
    console.groupEnd();

    localStorage.setItem('vod_offline', JSON.stringify(offline.map(x => x.id)));

    window.itemsCache = online;
    if (online.length) {
      listView.populateFilters?.(online);
      applyFilters?.();
    }

    countsEl.textContent = `A mostrar ${online.length} de ${vodItems.length}`;
  } catch (err) {
    console.error('Erro ao carregar VOD:', err);
    countsEl.textContent = 'Não foi possível carregar.';
  }
}

carregarVOD();
