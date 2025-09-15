// assets/js/main.js

import { loadConfig } from './modules/configManager.js';
import { initTheme } from './modules/themeManager.js';
import { attachUIControls } from './modules/uiControls.js';
import { initCharts } from './modules/chartManager.js';
import { initializeUpdater } from './modules/dashboardUpdate.js';
import { startPanelCycle } from './modules/dashboardCycle.js';
import { registerServiceWorker } from './modules/swRegister.js';
import { registerPWAUpdates } from './modules/pwaUpdater.js';
import { initOfflineHandler } from './modules/offlineHandler.js';
import * as favorites from './modules/favorites.js';

const exists = el => el != null;
const isHome = ['/', '/index.html', ''].includes(location.pathname);

/**
 * Carrega um fragmento HTML via fetch e injeta no elemento selecionado.
 */
async function loadComponent(selector, url, callback) {
  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    let html    = await res.text();
    const root  = isHome ? './' : '../';
    html        = html.replace(/{{root}}/g, root);
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = html;
      callback?.();
    }
  } catch (err) {
    console.error(`[main] Falha ao carregar ${url}:`, err);
  }
}

async function initPage() {
  // 1) Monta header e footer
  const headerPath = isHome 
    ? './components/header.html' 
    : '../components/header.html';
  const footerPath = isHome
    ? './components/footer-home.html'
    : '../components/footer.html';

  await loadComponent('header', headerPath, () => {
    document.dispatchEvent(new Event('oc:header-mounted'));
  });
  await loadComponent('footer', footerPath);

  // 2) Tema e modo de exibição iniciais
  initTheme();

  // 3) Handler de offline/online
  initOfflineHandler();

  // 4) Sincronização de favoritos entre abas
  window.addEventListener('storage', e => {
    if (e.key === favorites.STORAGE_KEY) {
      document.dispatchEvent(new CustomEvent('favoritesChanged'));
    }
  });

  // 5) Painéis de dashboard
  const panels = document.querySelectorAll('.painel');
  const config = loadConfig();
  if (panels.length > 1) {
    startPanelCycle(panels);
  }

  // 6) Gráficos e atualização de métricas
  const chartSelectors = {
    latencyCanvas: document.getElementById('chart-latencia'),
    itemsCanvas:   document.getElementById('chart-itens'),
    loadCanvas:    document.getElementById('chart-carregamento')
  };
  const charts = initCharts(chartSelectors, { maxPoints: config.maxChartPoints });

  const metricsSelectors = {
    timeEl:             document.getElementById('dashboard-time'),
    metricBackendEl:    document.getElementById('metric-backend'),
    metricNetworkEl:    document.getElementById('metric-rede'),
    metricSystemEl:     document.getElementById('metric-sistema'),
    metricContentEl:    document.getElementById('metric-conteudos'),
    highlightsListEl:   document.getElementById('lista-destaques'),
    chartLatencyEl:     chartSelectors.latencyCanvas,
    chartItemsEl:       chartSelectors.itemsCanvas,
    chartLoadEl:        chartSelectors.loadCanvas
  };

  const updater = initializeUpdater(config, metricsSelectors);
  if (config.autoRefresh) {
    updater.startAutoRefresh();
  }

  // 7) UI de configurações globais
  const uiSelectors = {
    btnOpenConfig:     document.getElementById('abrir-config-global'),
    panelConfig:       document.getElementById('painel-config-global'),
    btnSaveConfig:     document.getElementById('guardar-config-global'),
    btnManualRefresh:  document.getElementById('btn-refresh-manual'),
    themeRadios:       document.querySelectorAll('input[name="tema"]'),
    toggleUpdateAlert: document.getElementById('toggle-update-alert'),
    toggleAutoRefresh: document.getElementById('toggle-auto-refresh'),
    soundCheckboxes:   document.querySelectorAll('input[data-som]')
  };
  attachUIControls({ selectors: uiSelectors, updaterControls: updater });

  // 8) Service Worker e PWA Updates
  registerServiceWorker({
    onUpdateFound: sw => registerPWAUpdates({ updateAlert: config.updateAlert, waitingSW: sw })
  });

  // 9) Montagem final
  console.groupEnd();
}

document.addEventListener('DOMContentLoaded', initPage);
