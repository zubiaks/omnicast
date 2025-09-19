/**
 * Centralizador global de módulos.
 * Permite importar managers/modules de forma unificada:
 *
 * import { adaptersManager, configModule, dashboardModule, dataServiceModule,
 *          listModule, mediaModule, networkModule, uiModule, utilsModule } from '@modules'
 */

export { adaptersManager }   from './adapters/index.js'
export { configModule }      from './config/index.js'
export { dashboardModule }   from './dashboard/index.js'
export { dataServiceModule } from './dataService/index.js'
export { listModule }        from './list/index.js'
export { mediaModule }       from './media/index.js'
export { networkModule }     from './network/index.js'
export { uiModule }          from './ui/index.js'
export { utilsModule }       from './utils/index.js'

// --- Export agregado global ---
import { adaptersManager }   from './adapters/index.js'
import { configModule }      from './config/index.js'
import { dashboardModule }   from './dashboard/index.js'
import { dataServiceModule } from './dataService/index.js'
import { listModule }        from './list/index.js'
import { mediaModule }       from './media/index.js'
import { networkModule }     from './network/index.js'
import { uiModule }          from './ui/index.js'
import { utilsModule }       from './utils/index.js'

export const modules = {
  adaptersManager,
  configModule,
  dashboardModule,
  dataServiceModule,
  listModule,
  mediaModule,
  networkModule,
  uiModule,
  utilsModule
}

export default modules
