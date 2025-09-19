/**
 * Ponto único de import para o serviço de dados
 */
export * from './dataService.js'

import * as dataService from './dataService.js'

/** Export agregado */
export const dataServiceModule = {
  ...dataService
}

export default dataServiceModule
