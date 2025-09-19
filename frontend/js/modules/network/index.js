/**
 * Módulo central de rede:
 * Exporta funções e constantes para gerenciamento de conectividade,
 * PWA e Service Worker.
 *
 * @module modules/network
 */
export {
  getStatus,
  startStatusPolling,
  STATUS_EVENT,
  STATUS_ERROR_EVENT
} from './statusService.js'

export { initServiceWorker } from './registerServiceWorker.js'

export {
  initOfflineHandler,
  NETWORK_OFFLINE_EVENT,
  NETWORK_ONLINE_EVENT
} from './offlineHandler.js'

export { initPwaUpdater } from './pwaUpdater.js'

import * as statusService from './statusService.js'
import * as registerServiceWorker from './registerServiceWorker.js'
import * as offlineHandler from './offlineHandler.js'
import * as pwaUpdater from './pwaUpdater.js'

/** Export agregado */
export const networkModule = {
  ...statusService,
  ...registerServiceWorker,
  ...offlineHandler,
  ...pwaUpdater
}

export default networkModule
