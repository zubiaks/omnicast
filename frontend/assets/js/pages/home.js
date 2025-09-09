import { validarStream } from '../validators/validator-core.js';

const HOME_JSON = 'assets/data/master_list.json';

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function hydrateCountsValidated(data) {
  // IPTV
  const iptvResults = await Promise.allSettled(
    data.filter(x => x.type === 'iptv').map(validarStream)
  );
  const iptvOnline = iptvResults.filter(r => r.status === 'fulfilled' && r.value.online).length;
  setText('iptv-count', iptvOnline);

  // Webcams
  const webcamResults = await Promise.allSettled(
    data.filter(x => x.type === 'webcam').map(validarStream)
  );
  const webcamOnline = webcamResults.filter(r => r.status === 'fulfilled' && r.value.online).length;
  setText('webcam-count', webcamOnline);

  // VOD e Rádio (sem validação de stream)
  setText('vod-count', data.filter(x => x.type === 'vod').length);
  setText('radio-count', data.filter(x => x.type === 'radio').length);

  // Logs
  console.group('Resumo de validação Home');
  console.log(`IPTV online: ${iptvOnline}`);
  console.log(`Webcams online: ${webcamOnline}`);
  console.groupEnd();
}

function updateFavCounts(master) {
  const favSet = OCFavs.loadFavs();
  const favCounts = OCFavs.countFavsByType(master, favSet);
  setText('fav-count-iptv', favCounts.iptv);
  setText('fav-count-webcam', favCounts.webcam);
  setText('fav-count-vod', favCounts.vod);
  setText('fav-count-radio', favCounts.radio);
}

async function loadData() {
  try {
    const res = await fetch(HOME_JSON + '?_=' + Date.now());
    return await res.json();
  } catch {
    console.warn('Falha ao carregar lista principal da home, a usar backup.');
    try {
      const res = await fetch('assets/data/home_backup.json');
      return await res.json();
    } catch (err) {
      console.error('Falha ao carregar backup da home:', err);
      return [];
    }
  }
}

(async function initHome() {
  // Estado inicial
  ['iptv', 'webcam', 'vod', 'radio'].forEach(k => setText(`${k}-count`, '...'));

  // Usar cache se existir
  const cached = localStorage.getItem('oc:master');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (Array.isArray(data)) {
        await hydrateCountsValidated(data);
        updateFavCounts(data);
      }
    } catch (err) {
      console.warn('Erro ao usar cache da home:', err);
    }
  }

  // Carregar dados atuais
  const data = await loadData();
  if (!data.length) {
    ['iptv', 'webcam', 'vod', 'radio'].forEach(k => setText(`${k}-count`, 0));
    return;
  }

  await hydrateCountsValidated(data);
  updateFavCounts(data);
  localStorage.setItem('oc:master', JSON.stringify(data));

  // Tema claro/escuro
  const btn = document.getElementById('theme-toggle');
  const KEY = 'oc:theme';
  const apply = (mode) => document.documentElement.dataset.theme = mode;
  const saved = localStorage.getItem(KEY) || 'dark';
  apply(saved);
  btn?.addEventListener('click', () => {
    const now = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(now);
    localStorage.setItem(KEY, now);
  });

  // Sincronização em tempo real dos favoritos
  window.addEventListener('storage', (e) => {
    if (e.key === 'oc:favs') {
      const master = JSON.parse(localStorage.getItem('oc:master') || '[]');
      updateFavCounts(master);
    }
  });
})();
