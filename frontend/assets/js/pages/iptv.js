import { validarStream } from '../validators/validator-core.js';

listView.init({
  type: 'iptv',
  containerId: 'iptv-grid',
  toolbar: {
    searchId: 'iptv-search',
    filters: [
      { id: 'iptv-country', key: 'country' },
      { id: 'iptv-category', key: 'category' }
    ],
    sortId: 'iptv-sort',
    sortDirId: 'iptv-sort-dir',
    favBtnId: 'iptv-favs',
    countsId: 'iptv-counts'
  },
  moreBtnId: 'iptv-more',
  sentinelId: 'iptv-sentinel',
  pageSize: 24,
  paginationMode: 'infinite',
  emptyMessage: 'Nenhum canal encontrado com os filtros atuais.',
  populateFilters: (items) => {
    const countries = [...new Set(items.map(x => x.country).filter(Boolean))].sort();
    document.getElementById('iptv-country').innerHTML =
      '<option value="">Todos os países</option>' +
      countries.map(c => `<option value="${c}">${c}</option>`).join('');

    const categories = [...new Set(items.map(x => x.category).filter(Boolean))].sort();
    document.getElementById('iptv-category').innerHTML =
      '<option value="">Todas as categorias</option>' +
      categories.map(c => `<option value="${c}">${c}</option>`).join('');
  },
  card: (it, idx, isFav) => {
    const candidates = OC.buildCandidates(it).join('|');
    const fallback = OC.getFallback('iptv');
    return `
      <div class="card" style="border-top:4px solid var(--iptv)">
        <img data-type="iptv" data-candidates="${candidates}" data-fallback="${fallback}" alt="${it.name}">
        <h2>${it.name}</h2>
        <p>${it.country || ''} ${it.category || ''}</p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn" style="background:var(--iptv)" onclick="playItem(filteredCache[${idx}])">Play</button>
          <button class="btn" style="background:${isFav ? '#f59e0b' : '#374151'}"
                  onclick="toggleFav('${it.id}')">${isFav ? '★' : '☆'} Favorito</button>
        </div>
      </div>
    `;
  }
});

async function carregarCanais() {
  const countsEl = document.getElementById('iptv-counts');

  try {
    let data;
    try {
      const res = await fetch('../assets/data/master_list.json?_=' + Date.now());
      data = await res.json();
    } catch {
      console.warn('Falha ao carregar lista principal de IPTV, a usar backup.');
      try {
        const res = await fetch('../assets/data/iptv_backup.json');
        data = await res.json();
      } catch (err) {
        console.error('Falha ao carregar backup de IPTV:', err);
        countsEl.textContent = 'Não foi possível carregar.';
        return;
      }
    }

    const iptvItems = data.filter(x => x.type === 'iptv' && x.stream_url);

    if (!iptvItems.length) {
      countsEl.textContent = 'Nenhum canal disponível.';
      window.itemsCache = [];
      applyFilters?.();
      return;
    }

    const resultados = await Promise.allSettled(iptvItems.map(validarStream));

    const offline = [];
    const online = [];

    resultados.forEach(r => {
      if (r.status === 'fulfilled' && r.value.online) {
        online.push(r.value);
      } else if (r.status === 'fulfilled') {
        offline.push(r.value);
      }
    });

    console.group(`Canais IPTV offline (${offline.length})`);
    offline.forEach(c => console.warn(`${c.name}: ${c.motivo}`));
    console.groupEnd();

    localStorage.setItem('iptv_offline', JSON.stringify(offline.map(x => x.id)));

    window.itemsCache = online;
    if (online.length) {
      listView.populateFilters?.(online);
      applyFilters?.();
    }

    countsEl.textContent = `A mostrar ${online.length} de ${iptvItems.length}`;
  } catch (err) {
    console.error('Erro ao carregar canais IPTV:', err);
    countsEl.textContent = 'Não foi possível carregar.';
  }
}

carregarCanais();
