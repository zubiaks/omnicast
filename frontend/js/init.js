// assets/js/modules/statusDashboard.js

import { loadConfig } from './modules/configManager.js';
import { showToast } from './modules/alerts.js';

/**
 * Inicializa o dashboard de status: resumo, tabela, JSON cru e auto‐refresh.
 *
 * @param {Object} [opts]
 * @param {number} [opts.pollingMs]             — intervalo de refresh em ms
 * @param {Object} [opts.selectors]             — seletores ou elementos
 * @param {string|HTMLElement} [opts.selectors.dot]
 * @param {string|HTMLElement} [opts.selectors.last]
 * @param {string|HTMLElement} [opts.selectors.summary]
 * @param {string|HTMLElement} [opts.selectors.sumTotal]
 * @param {string|HTMLElement} [opts.selectors.sumOnline]
 * @param {string|HTMLElement} [opts.selectors.sumOffline]
 * @param {string|HTMLElement} [opts.selectors.tbody]
 * @param {string|HTMLElement} [opts.selectors.rawSection]
 * @param {string|HTMLElement} [opts.selectors.raw]
 * @param {string|HTMLElement} [opts.selectors.err]
 * @param {string|HTMLElement} [opts.selectors.btnRefresh]
 * @param {string|HTMLElement} [opts.selectors.chkAuto]
 * @param {string} [opts.historyIndexPath]       — caminho para lista de históricos
 * @param {string} [opts.defaultStatusPath]      — fallback de status.json
 * @returns {{
 *   loadAndRender:       () => Promise<void>,
 *   startAutoRefresh:    () => void,
 *   stopAutoRefresh:     () => void
 * }}
 */
export function initStatusDashboard({
  pollingMs,
  selectors = {},
  historyIndexPath = '/assets/data/lista_historicos.json',
  defaultStatusPath = '/assets/data/status.json'
} = {}) {
  const cfg        = loadConfig();
  const interval   = pollingMs ?? cfg.pollingStatusMs ?? 10000;
  let timerId      = null;

  // Resolve elementos ou seletores
  const el = {};
  [
    'dot','last','summary','sumTotal','sumOnline',
    'sumOffline','tbody','rawSection','raw','err',
    'btnRefresh','chkAuto'
  ].forEach(key => {
    const sel = selectors[key];
    el[key] = typeof sel === 'string'
      ? document.querySelector(sel)
      : sel || null;
  });

  // Formatação e utilitários
  const fmtDate = ts => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return String(ts);
    }
  };

  const escapeHtml = s => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const getColorVar = status => ({
    ok:   'var(--ok)',
    warn: 'var(--warn)',
    err:  'var(--err)'
  }[status] || 'var(--warn)');

  function setStatusDot(color) {
    if (el.dot) el.dot.style.background = getColorVar(color);
  }

  // Faz fetch com cache‐buster
  async function fetchJson(path) {
    const res = await fetch(`${path}?_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Encontra arquivo mais recente ou usa fallback
  async function getLatestStatusPath() {
    try {
      const list = await fetchJson(historyIndexPath);
      if (Array.isArray(list) && list.length) {
        const latest = list.sort().reverse()[0];
        return historyIndexPath.replace(/\/[^/]+$/, `/${latest}`);
      }
    } catch {
      // ignore e usa fallback
    }
    return defaultStatusPath;
  }

  // Normaliza payload em array de registros
  function normalizeData(data) {
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (Array.isArray(data.streams)) {
      items = data.streams;
    } else if (Array.isArray(data.items)) {
      items = data.items;
    } else if (data && typeof data === 'object') {
      items = Object.entries(data).map(([k, v]) => ({ name: k, ...(v || {}) }));
    }
    return items.map(it => ({
      name:       it.name || it.titulo || it.id || '—',
      status:     String(it.status || it.state || '').toLowerCase(),
      message:    it.message || it.msg || '',
      updated_at: it.updated_at || it.at || it.timestamp || null
    }));
  }

  // Renderiza quadro resumo (totais e dot)
  function renderSummary(list) {
    if (!el.summary) return;
    if (!list.length) {
      el.summary.classList.add('hide');
      return;
    }
    const online  = list.filter(i => i.status.includes('on')).length;
    const offline = list.filter(i => i.status.includes('off') || i.status.includes('fail')).length;

    el.sumTotal.textContent   = String(list.length);
    el.sumOnline.textContent  = String(online);
    el.sumOffline.textContent = String(offline);
    el.summary.classList.remove('hide');

    const color = offline === 0 
      ? 'ok' 
      : (online > 0 ? 'warn' : 'err');
    setStatusDot(color);
  }

  // Renderiza tabela de histórico
  function renderTable(list) {
    if (!el.tbody) return;
    if (!list.length) {
      el.tbody.innerHTML = `
        <tr><td colspan="4" class="muted center">Sem dados</td></tr>
      `;
      return;
    }
    el.tbody.innerHTML = list.map(it => {
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
  }

  // Exibe JSON cru
  function renderRaw(data) {
    if (!el.raw) return;
    el.raw.textContent = JSON.stringify(data, null, 2);
    el.rawSection?.classList.remove('hide');
  }

  // Mostra mensagem de erro no painel
  function showError(msg) {
    if (!el.err) return;
    el.err.textContent = `Erro: ${msg}`;
    el.err.classList.remove('hide');
    setStatusDot('err');
  }

  // Limpa mensagem de erro
  function hideError() {
    if (!el.err) return;
    el.err.textContent = '';
    el.err.classList.add('hide');
  }

  // Carrega e renderiza toda a UI de status
  async function loadAndRender() {
    hideError();
    try {
      const path = await getLatestStatusPath();
      const data = await fetchJson(path);

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

  // Inicia auto‐refresh
  function startAutoRefresh() {
    clearInterval(timerId);
    timerId = setInterval(loadAndRender, interval);
  }

  // Para auto‐refresh
  function stopAutoRefresh() {
    clearInterval(timerId);
    timerId = null;
  }

  // Ligação de eventos do usuário
  el.btnRefresh?.addEventListener('click', loadAndRender);
  el.chkAuto?.addEventListener('change', e => {
    if (e.target.checked) startAutoRefresh();
    else stopAutoRefresh();
  });

  // Primeira renderização
  loadAndRender();
  if (el.chkAuto?.checked) startAutoRefresh();

  return { loadAndRender, startAutoRefresh, stopAutoRefresh };
}
```