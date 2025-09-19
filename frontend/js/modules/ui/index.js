/**
 * Módulo principal de UI:
 * exporta as APIs de notificações, carregamento de componentes,
 * configurações de exibição, alternador de formato,
 * gerenciamento de tema e controles de interface.
 *
 * @module @modules/ui
 */

// Notificações e sons
export {
  showToast,
  addPulse,
  tocarSom,
  TOAST_EVENT,
  SOUND_PATHS
} from './alerts.js'

// Carregamento dinâmico de componentes HTML
export {
  loadComponent,
  COMPONENT_LOADED_EVENT,
  COMPONENT_ERROR_EVENT
} from './componentLoader.js'

// Configurações de exibição (tema + viewmode)
export { initDisplaySettings } from './displaySettings.js'

// Alternador de formato (aspect ratio)
export { initFormatSwitcher } from './formatSwitcher.js'

// Gerenciamento de tema
export {
  initTheme,
  applyTheme,
  toggleTheme,
  getTheme
} from './themeManager.js'

// Controles gerais de UI (painel, toggles, sons, refresh)
export { initUiControls } from './uiControls.js'

// --- Export agregado ---
import * as alerts from './alerts.js'
import * as componentLoader from './componentLoader.js'
import * as displaySettings from './displaySettings.js'
import * as formatSwitcher from './formatSwitcher.js'
import * as themeManager from './themeManager.js'
import * as uiControls from './uiControls.js'

export const uiModule = {
  ...alerts,
  ...componentLoader,
  ...displaySettings,
  ...formatSwitcher,
  ...themeManager,
  ...uiControls
}
