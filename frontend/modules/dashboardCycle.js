// assets/js/modules/dashboardCycle.js

let cycleIntervalId = null;

/**
 * Inicia o ciclo automático de exibição de painéis.
 * @param {NodeListOf<Element>} paineis  Lista de elementos de painel (.painel).
 * @param {number} intervaloMs            Intervalo em milissegundos para troca.
 * @returns {Function}                    Função para parar o ciclo.
 */
export function startPanelCycle(paineis, intervaloMs) {
  if (!paineis || paineis.length === 0 || typeof intervaloMs !== 'number') {
    console.warn('dashboardCycle: parâmetros inválidos');
    return () => {};
  }

  let idx = 0;
  // Exibe apenas o painel inicial
  paineis.forEach((panel, i) => panel.classList.toggle('ativo', i === idx));

  // Limpa ciclo anterior, se existir
  if (cycleIntervalId) clearInterval(cycleIntervalId);

  // Inicia novo ciclo
  cycleIntervalId = setInterval(() => {
    paineis[idx].classList.remove('ativo');
    idx = (idx + 1) % paineis.length;
    paineis[idx].classList.add('ativo');
  }, intervaloMs);

  // Retorna função para parar o ciclo
  return function stopPanelCycle() {
    if (cycleIntervalId) {
      clearInterval(cycleIntervalId);
      cycleIntervalId = null;
    }
  };
}
