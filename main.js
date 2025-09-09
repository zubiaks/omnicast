// assets/js/main.js

import { loadConfig } from './modules/configManager.js';
import { startPanelCycle } from './modules/dashboardCycle.js';
import { initializeUpdater } from './modules/dashboardUpdate.js';
import { attachUIControls } from './modules/uiControls.js';
import { registerPWAUpdates } from './modules/pwaUpdater.js';

// 1. Seletores DOM
const selectors = {
  paineis: document.querySelectorAll('.painel'),
  timeEl: document.getElementById('dashboard-time'),
  metricBackend: document.getElementById('metric-backend'),
  metricRede: document.getElementById('metric-rede'),
  metricSistema: document.getElementById('metric-sistema'),
  metricConteudos: document.getElementById('metric-conteudos'),
  listaDestaques: document.getElementById('lista-destaques'),
  chartLatenciaEl: document.getElementById('chart-latencia'),
  chartItensEl: document.getElementById('chart-itens'),
  chartCarregamentoEl: document.getElementById('chart-carregamento'),
  btnAbrirConfig: document.getElementById('abrir-config-global'),
  painelConfig: document.getElementById('painel-config-global'),
  btnGuardarConfig: document.getElementById('guardar-config-global'),
  btnRefreshManual: document.getElementById('btn-refresh-manual'),
  themeRadios: document.querySelectorAll('input[name="tema"]'),
  toggleUpdateAlert: document.getElementById('toggle-update-alert'),
  toggleAutoRefresh: document.getElementById('toggle-auto-refresh'),
  soundCheckboxes: document.querySelectorAll('input[data-som]')
};

// 2. Carregar config e aplicar tema
const config = loadConfig();
document.body.classList.toggle('theme-light', config.tema === 'light');
document.body.classList.toggle('theme-dark', config.tema === 'dark');

// 3. Iniciar ciclo de painéis
const stopCycle = startPanelCycle(selectors.paineis, config.panelCycleIntervalMs || 10000);

// 4. Inicializar updater (fetch, métricas, gráficos)
const updaterControls = initializeUpdater(config, selectors);

// 5. Ligar UI Controls (config, painel, botões)
attachUIControls({ config, selectors, updaterControls });

// 6. Registar PWA e banner de update
registerPWAUpdates(config);
