// src/startApp.js
import { configModule, dashboardModule, mediaModule, uiModule, utilsModule } from '@modules'

/**
 * Função de arranque da aplicação.
 * - Carrega configuração
 * - Inicializa e arranca o dashboard
 * - Tenta iniciar o stream de media
 * - Mostra feedback via UI
 * - Aplica tema se definido
 */
export async function startApp() {
  const cfg = configModule.loadConfig()

  // Inicialização do dashboard
  dashboardModule.initDashboard()
  dashboardModule.startPanelCycle()

  // Media + feedback UI
  try {
    await mediaModule.playStream(cfg.iptvUrl || '')
    uiModule.showToast('Stream iniciado com sucesso 🎬', 'info')
  } catch (err) {
    uiModule.showToast('Erro ao iniciar stream', 'error')
    utilsModule.eventBus.emit('media:error', err)
  }

  // Tema
  if (cfg.tema) {
    uiModule.applyTheme?.(cfg.tema)
  }

  return cfg
}
