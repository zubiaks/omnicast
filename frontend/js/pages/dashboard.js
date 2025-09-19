// frontend/js/pages/dashboard.js

import { initTheme }              from '@modules/ui/themeManager.js'
import { initDisplaySettings }    from '@modules/ui/displaySettings.js'
import { initUiControls }         from '@modules/ui/uiControls.js'
import { initOfflineHandler }     from '@modules/network/offlineHandler.js'
import { initPwaUpdater }         from '@modules/network/pwaUpdater.js'
import { configManager }          from '@modules/config/configManager.js'
import { initStatusDashboard }    from '@modules/dashboard/statusDashboard.js'
import { initDashboard }          from '@modules/dashboard/dashboard.js'

document.addEventListener('DOMContentLoaded', () => {
  // 1) Tema e layout
  initTheme()
  initDisplaySettings()

  // 2) Configurações e PWA/offline
  const cfg = configManager.loadConfig()
  initPwaUpdater({ updateAlert: cfg.updateAlert })
  initUiControls()
  initOfflineHandler()

  // 3) Painel de status dos serviços
  initStatusDashboard({
    selectors: {
      dot:        '#status-dot',
      last:       '#status-last',
      summary:    '#status-summary',
      sumTotal:   '#status-total',
      sumOnline:  '#status-online',
      sumOffline: '#status-offline',
      tbody:      '#status-tbody',
      rawSection: '#status-raw-section',
      raw:        '#status-raw',
      err:        '#status-err',
      btnRefresh: '#status-refresh-btn',
      chkAuto:    '#status-auto-checkbox'
    },
    config: {
      pollingMs: cfg.statusPollingMs
    }
  })

  // 4) Dashboard principal: gráficos e ciclos de painéis
  initDashboard({
    selectors: {
      panels:        document.querySelectorAll('.painel'),
      tabs:          document.querySelectorAll('[role="tab"][data-tab]'),
      timeEl:        document.getElementById('dashboard-time'),
      backendEl:     document.getElementById('metric-backend'),
      networkEl:     document.getElementById('metric-rede'),
      systemEl:      document.getElementById('metric-sistema'),
      contentEl:     document.getElementById('metric-conteudos'),
      highlightsEl:  document.getElementById('lista-destaques'),
      btnRefresh:    document.getElementById('btn-refresh-manual'),
      btnConfigOpen: document.getElementById('abrir-config-global'),
      panelConfig:   document.getElementById('painel-config-global'),
      latencyCanvas: document.getElementById('chart-latency'),
      itemsCanvas:   document.getElementById('chart-items'),
      loadCanvas:    document.getElementById('chart-load'),
      mainContainer: document.body
    },
    pollingIntervalKey: 'refreshIntervalMs'
  })
})
