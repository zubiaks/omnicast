// assets/js/modules/dashboardController.js

import { loadConfig } from './configManager.js';
import * as dataService from './dataService.js';
import { getStatus } from './statusService.js';
import { initCharts } from './chartManager.js';
import { showToast, addPulse } from './alerts.js';
import { registerServiceWorker } from './swRegister.js';
import { registerPWAUpdates } from './pwaUpdater.js';
import { applyTheme } from './themeManager.js';
import { startPanelCycle, stopPanelCycle } from './dashboardCycle.js';

/**
 * Inicializa todo o comportamento do dashboard:
 * - Tema e PWA
 * - Gráficos e histórico
 * - Indicadores de status, rede, sistema e conteúdo
 * - Ciclo de painéis e tabs
 * - Auto‐refresh de métricas
 */
export async function initDashboard({
  selectors = {},
  pollingIntervalKey = 'refreshIntervalMs'
} = {}) {
  const cfg = loadConfig();

  //
  // 1) Tema e PWA
  //
  applyTheme(cfg.tema);
  registerServiceWorker({
    onUpdateFound: sw => registerPWAUpdates({ config: cfg, waitingSW: sw })
  });

  //
  // 2) Gráficos e histórico
  //
  const charts = initCharts({
    latencyCanvas: selectors.latencyCanvas,
    itemsCanvas:   selectors.itemsCanvas,
    loadCanvas:    selectors.loadCanvas
  }, { maxPoints: cfg.maxChartPoints });

  const { latencyChart, itemsChart, loadChart } = charts;

  try {
    const history = await dataService.loadHistoricos();
    history.forEach(point => {
      latencyChart.push(Number(point.latencia) || 0);
      loadChart.push(Number(point.loadTime) || 0);
      itemsChart.updateItems([
        Number(point.counts.iptv)   || 0,
        Number(point.counts.webcam) || 0,
        Number(point.counts.vod)    || 0,
        Number(point.counts.radio)  || 0
      ]);
    });
  } catch (err) {
    console.warn('[dashboard] histórico indisponível', err);
  }

  //
  // 3) Seletores do DOM (fallback para IDs padrão)
  //
  const sel = {
    panels:          selectors.panels          || document.querySelectorAll('.painel'),
    tabs:            selectors.tabs            || document.querySelectorAll('[role="tab"][data-tab]'),
    timeEl:          selectors.timeEl          || document.getElementById('dashboard-time'),
    backendEl:       selectors.backendEl       || document.getElementById('metric-backend'),
    networkEl:       selectors.networkEl       || document.getElementById('metric-rede'),
    systemEl:        selectors.systemEl        || document.getElementById('metric-sistema'),
    contentEl:       selectors.contentEl       || document.getElementById('metric-conteudos'),
    highlightsEl:    selectors.highlightsEl    || document.getElementById('lista-destaques'),
    btnRefresh:      selectors.btnRefresh      || document.getElementById('btn-refresh-manual'),
    btnConfigOpen:   selectors.btnConfigOpen   || document.getElementById('abrir-config-global'),
    panelConfig:     selectors.panelConfig     || document.getElementById('painel-config-global'),
    mainContainer:   selectors.mainContainer   || document.body
  };

  //
  // 4) Helpers de UI
  //
  const nowTime = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

  const clamp = (v, def = 0) =>
    Number.isFinite(Number(v)) ? Number(v) : def;

  const escapeHtml = s =>
    String(s || '').replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]
    );

  function renderBox(el, title, lines = []) {
    if (!el) return;
    el.innerHTML = `<h3>${escapeHtml(title)}</h3>`
      + lines.map(line => `<div>${escapeHtml(line)}</div>`).join('');
  }

  function renderHighlights(list = []) {
    if (!sel.highlightsEl) return;
    if (!Array.isArray(list) || list.length === 0) {
      sel.highlightsEl.innerHTML = `<div class="item muted">Sem eventos.</div>`;
      return;
    }
    sel.highlightsEl.innerHTML = list
      .slice(0, 5)
      .map(i => `<div class="item">🎬 ${escapeHtml(i.name)}</div>`)
      .join('');
  }

  let prevCounts = null;
  function detectNewContent(counts) {
    if (prevCounts) {
      for (const k of Object.keys(counts)) {
        if (counts[k] > prevCounts[k]) {
          showToast('Novo conteúdo disponível', 'info');
          addPulse(sel.contentEl);
          break;
        }
      }
    }
    prevCounts = { ...counts };
  }

  let lastAlert = { backendOffline: false, highLatency: false };
  function applyLatencyAlert(isOnline, lat) {
    const thr = clamp(cfg.latenciaThreshold, 200);
    const offline = !isOnline;
    const highLat = isOnline && lat > thr;

    sel.backendEl?.classList.toggle('alert', offline || highLat);

    if (offline && !lastAlert.backendOffline) {
      showToast('Backend offline', 'critical');
    } else if (highLat && !lastAlert.highLatency) {
      showToast(`Latência alta (${lat} ms)`, 'warning');
    }

    lastAlert = { backendOffline: offline, highLatency: highLat };
  }

  function setBusy(flag) {
    sel.mainContainer?.setAttribute('aria-busy', flag ? 'true' : 'false');
  }

  //
  // 5) Update principal
  //
  let updating = false;
  async function updateDashboard() {
    if (updating) return;
    updating = true;
    setBusy(true);

    sel.timeEl && (sel.timeEl.textContent = nowTime());

    if (navigator.onLine === false) {
      renderBox(sel.backendEl, 'Backend', [
        'Status: 🔴 Offline', 'Latência: —', 'Última: —'
      ]);
      applyLatencyAlert(false, Infinity);
      setBusy(false);
      updating = false;
      return;
    }

    try {
      const { statusData, latencia } = await getStatus(cfg.apiBase);
      const lat = clamp(latencia);
      const genAt = statusData?.generatedAt || statusData?.generated_at;

      // Backend
      renderBox(sel.backendEl, 'Backend', [
        `Status: ${statusData ? '🟢 Online' : '🔴 Offline'}`,
        `Latência: ${lat} ms`,
        `Última: ${genAt ? new Date(genAt).toLocaleTimeString() : '—'}`
      ]);

      // Rede & Sistema (placeholders; substituir por dados reais se houver)
      renderBox(sel.networkEl, 'Rede',   ['Download: 50 Mbps', 'Upload: 10 Mbps']);
      renderBox(sel.systemEl,  'Sistema',['CPU: 35 %', 'Memória: 2.1 GB']);

      // Conteúdos
      const counts = {
        iptv:   statusData?.iptv?.length   || 0,
        webcam: statusData?.webcam?.length || 0,
        vod:    statusData?.vod?.length    || 0,
        radio:  statusData?.radio?.length  || 0
      };
      renderBox(sel.contentEl, 'Conteúdos', [
        `IPTV: ${counts.iptv}`,
        `Webcams: ${counts.webcam}`,
        `VOD: ${counts.vod}`,
        `Rádios: ${counts.radio}`
      ]);

      // Atualiza gráfico de itens e destaques
      itemsChart.updateItems([
        counts.iptv, counts.webcam, counts.vod, counts.radio
      ]);
      renderHighlights(statusData?.vod);
      detectNewContent(counts);

      // Atualiza séries de latência e carregamento
      latencyChart.push(lat);
      loadChart.push((performance.now() / 1000).toFixed(2));

      applyLatencyAlert(Boolean(statusData), lat);
    } catch (err) {
      console.error('[dashboard] update error', err);
      showToast('Erro ao atualizar dashboard', 'error');
    } finally {
      setBusy(false);
      updating = false;
    }
  }

  //
  // 6) Auto‐refresh e manual refresh
  //
  // Mostrar/esconder botão manual
  if (sel.btnRefresh) {
    sel.btnRefresh.hidden = !!cfg.autoRefresh;
    sel.btnRefresh.addEventListener('click', updateDashboard);
  }

  // Start auto‐refresh
  if (cfg.autoRefresh) {
    const ms = clamp(cfg[pollingIntervalKey], 15000);
    setInterval(updateDashboard, ms);
  }

  //
  // 7) Tabs & Ciclo de painéis
  //
  function initTabs() {
    const panelMap = {};
    sel.panels.forEach(p => {
      panelMap[p.id.replace('painel-', '')] = p;
    });
    sel.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.tab;
        sel.tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');

        Object.values(panelMap).forEach(p => p.hidden = true);
        panelMap[key].hidden = false;

        stopPanelCycle();
        startPanelCycle(sel.panels, cfg.panelCycleIntervalMs);
      });
    });
  }
  initTabs();

  //
  // 8) Config global
  //
  sel.btnConfigOpen?.addEventListener('click', () => {
    const expanded = sel.panelConfig?.getAttribute('aria-expanded') === 'true';
    sel.panelConfig?.setAttribute('aria-expanded', String(!expanded));
  });

  //
  // 9) Inicia ciclo de painéis e primeira atualização
  //
  startPanelCycle(sel.panels, cfg.panelCycleIntervalMs);
  await updateDashboard();
}
