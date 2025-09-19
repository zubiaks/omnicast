/**
 * Módulo principal do Dashboard
 */
export { initCharts } from './dashboardCharts.js'
export { initDashboard } from './dashboardController.js'
export {
  startPanelCycle,
  stopPanelCycle,
  PANEL_CYCLE_INTERVAL_KEY,
  PANEL_CYCLE_EVENT
} from './dashboardCycle.js'
export { initStatusDashboard } from './statusDashboard.js'
export { initDashboardUpdater } from './dashboardUpdater.js'

import * as dashboardCharts from './dashboardCharts.js'
import * as dashboardController from './dashboardController.js'
import * as dashboardCycle from './dashboardCycle.js'
import * as statusDashboard from './statusDashboard.js'
import * as dashboardUpdater from './dashboardUpdater.js'

/** Export agregado */
export const dashboardModule = {
  ...dashboardCharts,
  ...dashboardController,
  ...dashboardCycle,
  ...statusDashboard,
  ...dashboardUpdater
}
