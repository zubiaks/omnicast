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
