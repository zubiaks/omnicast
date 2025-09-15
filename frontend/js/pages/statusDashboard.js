// assets/js/modules/statusDashboard.js
import { showToast } from './alerts.js';

/**
 * Inicializa o dashboard de status: indicadores, histórico e JSON cru.
 *
 * @param {Object} options
 * @param {number} [options.pollingMs=10000]
 *   Intervalo de auto‐refresh em ms.
 * @param {Object} [options.selectors]
 * @param {string|HTMLElement} selectors.dot
 * @param {string|HTMLElement} selectors.last
 * @param {string|HTMLElement} selectors.summary
 * @param {string|HTMLElement} selectors.sumTotal
 * @param {string|HTMLElement} selectors.sumOnline
 * @param {string|HTMLElement} selectors.sumOffline
 * @param {string|HTMLElement} selectors.tbody
 * @param {string|HTMLElement} selectors.rawSection
 * @param {string|HTMLElement} selectors.raw
 * @param {string|HTMLElement} selectors.err
 * @param {string|HTMLElement} selectors.btnRefresh
 * @param {string|HTMLElement} selectors.chkAuto
 * @param {string} [options.historyIndexPath='assets/data/lista_historicos.json']
 *   JSON com lista de arquivos de histórico.
 * @param {string} [options.defaultDataPath='assets/data/status.json']
 *   Fallback quando não achar histórico.
 */
export function initStatusDashboard({
  pollingMs = 10000,
  selectors = {},
  historyIndexPath = 'assets/data/lista_historicos.json',
  defaultDataPath = 'assets/data/status.json'
} = {}) {
  // Resolve elemento ou seletor
  const el = {};
  for (const key of [
    'dot','last','summary','sumTotal','sumOnline',
    'sumOffline','tbody','rawSection','raw','err',
    'btnRefresh','chkAuto'
  ]) {
    const sel = selectors[key];
    el[key] = typeof sel === 'string'
      ? document.querySelector(sel)
      : sel || null;
  }

  let timer = null;

  function getColor(status) {
    return {
      ok:   'var(--ok)',
      warn: 'var(--warn)',
      err:  'var(--err)'
    }[status] || 'var(--warn)';
  }

  function setStatusDot(color) {
    if (el.dot) el.dot.style.background = getColor(color);
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    try {
      const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
      return d.toLocaleString();
    } catch {
      return String(ts);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function fetchWithCacheBuster(path) {
    const url = `${path}?_=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function getLatestDataPath() {
    try {
      const arr = await fetchWithCacheBuster(historyIndexPath);
      if (Array.isArray(arr) && arr.length) {
        const lastFile = arr.sort().reverse()[0];
        return historyIndexPath.replace(/lista_historicos\.json$/, lastFile);
      }
    } catch {
      // fallback
    }
    return defaultDataPath;
  }

  function normalizeData(data) {
    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data.streams)) {
      list = data.streams;
    } else if (Array.isArray(data.items)) {
      list = data.items;
    } else if (data && typeof data === 'object') {
      list = Object.entries(data).map(([k, v]) => ({ name: k, ...(v || {}) }));
    }

    return list.map(it => ({
      name:       it.name || it.titulo || it.id || '—',
      status:     String(it.status || it.state || '').toLowerCase(),
      message:    it.message || it.msg || '',
      updated_at: it.updated_at || it.at || it.timestamp || null
    }));
  }

  function renderSummary(list) {
    if (!el.summary) return;
    if (!list.length) {
      el.summary.classList.add('hide');
      return;
    }

    const online  = list.filter(x => x.status.includes('on')).length;
    const offline = list.filter(x => x.status.includes('off') || x.status.includes('fail')).length;

    el.sumTotal.textContent   = String(list.length);
    el.sumOnline.textContent  = String(online);
    el.sumOffline.textContent = String(offline);
    el.summary.classList.remove('hide');

    const color = offline === 0
      ? 'ok'
      : (online > 0 ? 'warn' : 'err');
    setStatusDot(color);
  }

  function renderTable(list) {
    if (!el.tbody) return;
    if (!list.length) {
      el.tbody.innerHTML = `
        <tr><td colspan="4" class="muted center">Sem dados</td></tr>
      `;
      return;
    }

    const rows = list.map(it => {
      const badge = it.status.includes('on') ? 'ok'
                  : (it.status ? 'err' : 'warn');
      const label = it.status || 'desconhecido';
      return `
        <tr>
          <td>${escapeHtml(it.name)}</td>
          <td><span class="badge ${badge}">${escapeHtml(label)}</span></td>
          <td>${escapeHtml(it.message)}</td>
          <td>${escapeHtml(fmtDate(it.updated_at))}</td>
        </tr>
      `;
    }).join('');
    el.tbody.innerHTML = rows;
  }

  function renderRaw(data) {
    if (!el.raw) return;
    el.raw.textContent = JSON.stringify(data, null, 2);
    el.rawSection?.classList.remove('hide');
  }

  function showError(msg) {
    if (!el.err) return;
    el.err.textContent = `Erro: ${msg}`;
    el.err.classList.remove('hide');
    setStatusDot('err');
  }

  function hideError() {
    if (!el.err) return;
    el.err.textContent = '';
    el.err.classList.add('hide');
  }

  async function loadAndRender() {
    hideError();
    try {
      const path = await getLatestDataPath();
      const data = await fetchWithCacheBuster(path);

      // Data gerada
      const ts = data.generated_at || data.timestamp || Date.now();
      if (el.last) el.last.textContent = fmtDate(ts);

      const list = normalizeData(data);
      renderSummary(list);
      renderTable(list);
      renderRaw(data);
    } catch (err) {
      console.error('[statusDashboard]', err);
      showError(err.message || String(err));
      showToast('Falha ao carregar status.', 'error');
    }
  }

  function startAutoRefresh() {
    if (timer) clearInterval(timer);
    timer = setInterval(loadAndRender, pollingMs);
  }

  function stopAutoRefresh() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Eventos de UI
  el.btnRefresh?.addEventListener('click', loadAndRender);
  el.chkAuto?.addEventListener('change', e => {
    if (e.target.checked) startAutoRefresh();
    else stopAutoRefresh();
  });

  // Inicialização
  loadAndRender();
  if (el.chkAuto?.checked) startAutoRefresh();

  return { loadAndRender, startAutoRefresh, stopAutoRefresh };
}
