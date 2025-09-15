// assets/js/components/search.js
(() => {
  const modal   = document.getElementById('oc-search');
  const input   = document.getElementById('oc-search-input');
  const results = document.getElementById('oc-search-results');
  const DATA_URL = '/data/status.json';

  let items = [];
  let selectedIndex = -1;

  function openSearch() {
    modal.hidden = false;
    modal.classList.add('oc-modal--visible');
    input.value = '';
    clearResults();
    selectedIndex = -1;
    input.focus();
  }

  function closeSearch() {
    modal.hidden = true;
    modal.classList.remove('oc-modal--visible');
  }

  function clearResults() {
    results.innerHTML = '';
    results.removeAttribute('aria-activedescendant');
    items = [];
  }

  function renderResults(hits) {
    clearResults();
    if (!hits.length) {
      const li = document.createElement('li');
      li.textContent = 'Sem resultados';
      results.append(li);
      return;
    }
    hits.slice(0,20).forEach((hit, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.id = `oc-search-item-${idx}`;

      const a = document.createElement('a');
      a.href = hit.href;
      a.textContent = `[${hit.type}] ${hit.name}`;
      a.tabIndex = -1;

      li.append(a);
      results.append(li);
      items.push(li);
    });
    selectItem(0);
  }

  function selectItem(idx) {
    if (idx < 0 || idx >= items.length) return;
    if (selectedIndex >= 0) items[selectedIndex].setAttribute('aria-selected','false');
    selectedIndex = idx;
    const current = items[idx];
    current.setAttribute('aria-selected','true');
    results.setAttribute('aria-activedescendant', current.id);
    current.querySelector('a').focus();
  }

  async function onSearchInput() {
    const q = input.value.trim().toLowerCase();
    if (!q) return clearResults();

    const resp = await fetch(DATA_URL, { cache: 'no-store' });
    const data = await resp.json();
    const pool = [
      ...(data.iptv    || []).map(x => ({ ...x, type:'IPTV',   href:`/pages/iptv.html?play=id:${x.id}` })),
      ...(data.vod     || []).map(x => ({ ...x, type:'VOD',    href:`/pages/vod.html?play=id:${x.id}` })),
      ...(data.radios  || []).map(x => ({ ...x, type:'Rádio',  href:`/pages/radio.html?play=id:${x.id}` })),
      ...(data.webcams || []).map(x => ({ ...x, type:'Webcam', href:`/pages/webcams.html?play=id:${x.id}` }))
    ];
    const hits = pool.filter(item => item.name?.toLowerCase().includes(q));
    renderResults(hits);
  }

  function onKeyDown(e) {
    switch (e.key) {
      case 'Escape': return closeSearch();
      case 'ArrowDown':
        e.preventDefault();
        return selectItem(selectedIndex + 1);
      case 'ArrowUp':
        e.preventDefault();
        return selectItem(selectedIndex - 1);
      case 'Enter':
        if (selectedIndex >= 0) items[selectedIndex].querySelector('a').click();
        break;
    }
  }

  document.addEventListener('oc:open-search', openSearch);
  modal.addEventListener('click', e => {
    if (e.target.dataset.close === '' || e.target === modal) closeSearch();
  });
  input.addEventListener('input', onSearchInput);
  input.addEventListener('keydown', onKeyDown);
  results.addEventListener('keydown', onKeyDown);
})();
