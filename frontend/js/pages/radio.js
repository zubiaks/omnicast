// assets/js/pages/radio.js

import { loadConfig } from '../modules/configManager.js';
import { showToast } from '../modules/alerts.js';
import { validarStream } from '../modules/validator-core.js';

/**
 * Inicializa a página de Rádios:
 * • Carrega status via JSON (com fallback)  
 * • Renderiza tabela com nome, estado e metadados  
 * • Atualiza “Última” e auto‐refresh configurable  
 * • Opcional: valida cada stream via validarStream
 */
export function initRadioPage() {
  const cfg            = loadConfig();
  const tbody          = document.querySelector('#radiosTable tbody');
  const lastUpdateEl   = document.getElementById('lastUpdate');
  const refreshMs      = cfg.radioRefreshMs ?? 30000;

  if (!tbody || !lastUpdateEl) {
    console.warn('[radio] Elementos de tabela não encontrados.');
    return;
  }

  function setTableMessage(message, cssClass = '') {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="${cssClass}">${message}</td>
      </tr>
    `;
  }

  function renderTable(radios) {
    tbody.innerHTML = '';
    const frag = document.createDocumentFragment();
    radios.forEach(radio => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${radio.Nome || ''}</td>
        <td class="${radio.Estado === 'online' ? 'online' : 'offline'}">
          ${radio.Estado || ''}
        </td>
        <td>${radio.Pontuação ?? ''}</td>
        <td>${radio['Tempo de Resposta'] ?? ''}</td>
        <td>${radio.Bitrate ?? ''}</td>
        <td>${radio.Género ?? ''}</td>
        <td>${radio['Música Atual'] ?? ''}</td>
      `;
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);

    const offline = radios.filter(r => r.Estado !== 'online');
    if (offline.length > 0) {
      console.group(`[radio] Offline (${offline.length})`);
      offline.forEach(r => console.warn(`${r.Nome || '—'}: ${r.Estado}`));
      console.groupEnd();
    }
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadAndRender() {
    setTableMessage('A carregar…');

    let data;
    try {
      data = await fetchJson('/assets/data/status.json');
    } catch {
      console.warn('[radio] status.json falhou, usando backup.');
      try {
        data = await fetchJson('/assets/data/status_backup.json');
      } catch (err) {
        console.error('[radio] backup também falhou:', err);
        setTableMessage('Erro ao carregar dados', 'offline');
        lastUpdateEl.textContent = '—';
        showToast('Não foi possível carregar as rádios.', 'error');
        return;
      }
    }

    const stats   = Array.isArray(data.radios) ? data.radios : [];
    if (stats.length === 0) {
      setTableMessage('Nenhuma rádio disponível', 'muted');
      lastUpdateEl.textContent = '—';
      return;
    }

    // Opcional: revalida streams (se existir URL em radio.URL ou radio.stream_url)
    if (cfg.validateStreams) {
      const validated = await Promise.allSettled(
        stats.map(item => {
          const url = item.URL || item.stream_url || item.url;
          return validarStream(url).then(res => ({ ...item, online: res.online }));
        })
      );
      // mantém apenas registros que foram validados com sucesso
      data.radios = validated
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
    }

    renderTable(data.radios);

    // Atualiza timestamp de generated_at ou fallback para agora
    const ts = data.generated_at || data.timestamp || Date.now();
    lastUpdateEl.textContent = new Date(ts).toLocaleTimeString();
  }

  // primeira carga e auto‐refresh
  loadAndRender();
  const timerId = setInterval(loadAndRender, refreshMs);

  // retorna função para limpar o intervalo, se necessário
  return () => clearInterval(timerId);
}

// Auto‐bootstrap quando o <table id="radiosTable"> existir
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('radiosTable')) {
    initRadioPage();
  }
});
