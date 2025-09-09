import { validarStream } from '../validators/validator-core.js';

listView.init({
  type: 'webcam',
  containerId: 'webcam-list',
  toolbar: {
    searchId: 'webcam-search',
    filters: [
      { id: 'webcam-country', key: 'country' },
      { id: 'webcam-city', key: 'city' }
    ],
    sortId: 'webcam-sort',
    sortDirId: 'webcam-sort-dir',
    favBtnId: 'webcam-favs',
    countsId: 'webcam-counts'
  },
  moreBtnId: 'webcam-more',
  sentinelId: 'webcam-sentinel',
  pageSize: 24,
  paginationMode: 'infinite',
  emptyMessage: 'Nenhuma webcam encontrada com os filtros atuais.',
  populateFilters: (items) => {
    const countries = [...new Set(items.map(x => x.country).filter(Boolean))].sort();
    document.getElementById('webcam-country').innerHTML =
      '<option value="">Todos os países</option>' +
      countries.map(c => `<option value="${c}">${c}</option>`).join('');

    const cities = [...new Set(items.map(x => x.city).filter(Boolean))].sort();
    document.getElementById('webcam-city').innerHTML =
      '<option value="">Todas as cidades</option>' +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');

    // Atualizar cidades ao mudar país
    document.getElementById('webcam-country').addEventListener('change', () => {
      const country = document.getElementById('webcam-country').value;
      const pool = country ? items.filter(x => x.country === country) : items;
      const citiesFiltered = [...new Set(pool.map(x => x.city).filter(Boolean))].sort();
      document.getElementById('webcam-city').innerHTML =
        '<option value="">Todas as cidades</option>' +
        citiesFiltered.map(c => `<option value="${c}">${c}</option>`).join('');
    });
  },
  card: (it, idx, isFav) => {
    const candidates = OC.buildCandidates(it).join('|');
    const fallback = OC.getFallback('webcam');
    const place = [it.city, it.country].filter(Boolean).join(', ');
    return `
      <div class="card" style="border-top:4px solid var(--webcam)">
        <img data-type="webcam" data-candidates="${candidates}" data-fallback="${fallback}" alt="${it.name}">
        <h2>${it.name}</h2>
        <p>${place}</p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn" style="background:var(--webcam)" onclick="playItem(filteredCache[${idx}])">Ver</button>
          <button class="btn" style="background:${isFav ? '#f59e0b' : '#374151'}"
                  onclick="toggleFav('${it.id}')">${isFav ? '★' : '☆'} Favorito</button>
        </div>
      </div>
    `;
  }
});

async function carregarWebcams() {
  const countsEl = document.getElementById('webcam-counts');

  try {
    let data;
    try {
      const res = await fetch('../assets/data/master_list.json?_=' + Date.now());
      data = await res.json();
    } catch {
      console.warn('Falha ao carregar lista principal de webcams, a usar backup.');
      try {
        const res = await fetch('../assets/data/webcam_backup.json');
        data = await res.json();
      } catch (err) {
        console.error('Falha ao carregar backup de webcams:', err);
        countsEl.textContent = 'Não foi possível carregar.';
        return;
      }
    }

    const webcams = data.filter(x => x.type === 'webcam' && x.stream_url);

    if (!webcams.length) {
      countsEl.textContent = 'Nenhuma webcam disponível.';
      window.itemsCache = [];
      applyFilters?.();
      return;
    }

    const resultados = await Promise.allSettled(webcams.map(validarStream));

    const offline = [];
    const online = [];

    resultados.forEach(r => {
      if (r.status === 'fulfilled' && r.value.online) {
        online.push(r.value);
      } else if (r.status === 'fulfilled') {
        offline.push(r.value);
      }
    });

    console.group(`Webcams offline (${offline.length})`);
    offline.forEach(c => console.warn(`${c.name}: ${c.motivo}`));
    console.groupEnd();

    localStorage.setItem('webcam_offline', JSON.stringify(offline.map(x => x.id)));

    window.itemsCache = online;
    if (online.length) {
      listView.populateFilters?.(online);
      applyFilters?.();
    }

    countsEl.textContent = `A mostrar ${online.length} de ${webcams.length}`;
  } catch (err) {
    console.error('Erro ao carregar webcams:', err);
    countsEl.textContent = 'Não foi possível carregar.';
  }
}

carregarWebcams();
