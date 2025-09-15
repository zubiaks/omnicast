// assets/js/modules/dashboardCycle.js
import { loadConfig } from './configManager.js';

let cycleIntervalId = null;
let currentIndex = 0;

/**
 * Inicia o ciclo automático de exibição de painéis.
 * Usa config.intervaloPainel se intervaloMs não for fornecido.
 *
 * @param {NodeListOf<HTMLElement>} panels
 * @param {number} [intervaloMs]
 */
export function startPanelCycle(panels, intervaloMs) {
  const cfg = loadConfig();
  const intervalo = typeof intervaloMs === 'number'
    ? intervaloMs
    : Number(cfg.intervaloPainel) || 10000;

  if (!panels || panels.length < 2) {
    console.warn('dashboardCycle: forneça ao menos 2 painéis');
    return;
  }

  stopPanelCycle();

  currentIndex %= panels.length;
  panels.forEach((panel, idx) => {
    const active = idx === currentIndex;
    panel.classList.toggle('ativo', active);
    panel.setAttribute('aria-hidden', String(!active));
  });
  dispatchPanelChange(currentIndex);

  cycleIntervalId = setInterval(() => {
    const prev = currentIndex;
    panels[prev].classList.remove('ativo');
    panels[prev].setAttribute('aria-hidden', 'true');

    currentIndex = (prev + 1) % panels.length;
    panels[currentIndex].classList.add('ativo');
    panels[currentIndex].setAttribute('aria-hidden', 'false');

    dispatchPanelChange(currentIndex);
  }, intervalo);

  window.addEventListener('configChanged', onConfigChanged);
}

/**
 * Para o ciclo automático de painéis.
 */
export function stopPanelCycle() {
  if (cycleIntervalId !== null) {
    clearInterval(cycleIntervalId);
    cycleIntervalId = null;
    window.removeEventListener('configChanged', onConfigChanged);
  }
}

/**
 * Reinicia o ciclo caso `intervaloPainel` seja alterado em config.
 *
 * @param {CustomEvent} e
 */
function onConfigChanged(e) {
  if ('intervaloPainel' in e.detail) {
    const panels = document.querySelectorAll('.painel');
    stopPanelCycle();
    startPanelCycle(panels, Number(e.detail.intervaloPainel));
  }
}

/**
 * Dispara evento sempre que muda o painel ativo.
 *
 * @param {number} index
 */
function dispatchPanelChange(index) {
  document.dispatchEvent(
    new CustomEvent('panelCycle:changed', { detail: { index } })
  );
}
