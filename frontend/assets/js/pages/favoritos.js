import { validarStream } from '../validators/validator-core.js';

const container = document.getElementById('fav-container');
let favItems = [];
let favSet = OCFavs.loadFavs();

function updateTabCounts() {
  const counts = { all: favItems.length, iptv: 0, webcam: 0, vod: 0, radio: 0 };
  favItems.forEach(it => counts[it.type]++);
  for (const key in counts) {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = counts[key];
  }
}

function renderFavs(filterType = 'all') {
  const list = filterType === 'all' ? favItems : favItems.filter(it => it.type === filterType);
  if (!list.length) {
    container.innerHTML = '<p class="tip">Nenhum favorito neste filtro.</p>';
    return;
  }
  container.innerHTML = list.map((it, idx) => {
    const candidates = OC.buildCandidates(it).join('|');
    const fallback = OC.getFallback(it.type);
    const meta = [it.country, it.category].filter(Boolean).join(' • ');
    return `
      <div class="card" style="border-top:4px solid var(--${it.type})">
        <img data-type="${it.type}" data-candidates="${candidates}" data-fallback="${fallback}" alt="${it.name}">
        <h2>${it.name}</h2>
        <p>${meta}</p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn" style="background:var(--${it.type})" onclick="playItem(favItems[${idx}])">Abrir</button>
          <button class="btn" style="background:#f59e0b" onclick="toggleFav('${it.id}')">★ Remover</button>
        </div>
      </div>
    `;
  }).join('');
  OC.applyImgFallback(container);
}

async function carregarFavoritos() {
  try {
    let data;
    try {
      const res = await fetch('../assets/data/master_list.json?_=' + Date.now());
      data = await res.json();
    } catch {
      console.warn('Falha ao carregar lista principal de favoritos, a usar backup.');
      try {
        const res = await fetch('../assets/data/favs_backup.json');
        data = await res.json();
      } catch (err) {
        console.error('Falha ao carregar backup de favoritos:', err);
        container.innerHTML = '<p class="tip">Erro ao carregar favoritos.</p>';
        return;
      }
    }

    const favCandidates = data.filter(it => favSet.has(it.id));
    if (!favCandidates.length) {
      favItems = [];
      updateTabCounts();
      renderFavs();
      return;
    }

    const resultados = await Promise.allSettled(favCandidates.map(validarStream));

    const offline = [];
    const online = [];

    resultados.forEach(r => {
      if (r.status === 'fulfilled' && r.value.online) {
        online.push(r.value);
      } else if (r.status === 'fulfilled') {
        offline.push(r.value);
      }
    });

    console.group(`Favoritos offline (${offline.length})`);
    offline.forEach(c => console.warn(`${c.name}: ${c.motivo}`));
    console.groupEnd();

    favItems = online;
    updateTabCounts();
    const activeTab = document.querySelector('nav.toolbar .btn.active')?.dataset.tab || 'all';
    renderFavs(activeTab);
  } catch (err) {
    console.error('Erro ao carregar favoritos:', err);
    container.innerHTML = '<p class="tip">Erro ao carregar favoritos.</p>';
  }
}

// Tabs de filtro
document.querySelectorAll('nav.toolbar .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav.toolbar .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderFavs(btn.dataset.tab);
  });
});

// Atualizar se favoritos mudarem noutra página
window.addEventListener('storage', (e) => {
  if (e.key === 'oc:favs') {
    favSet = OCFavs.loadFavs();
    favItems = favItems.filter(it => favSet.has(it.id));
    updateTabCounts();
    const activeTab = document.querySelector('nav.toolbar .btn.active')?.dataset.tab || 'all';
    renderFavs(activeTab);
  }
});

// Iniciar
carregarFavoritos();
