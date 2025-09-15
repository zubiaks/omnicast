// assets/js/modules/statusService.js

/**
 * Busca o status da API e mede a latência da requisição.
 *
 * @param {string} apiUrl — URL base da API (sem barra final)
 * @param {object} [options]
 * @param {number} [options.timeout=5000] — tempo máximo em ms antes de abortar a requisição
 * @param {string} [options.endpoint='/status'] — caminho do endpoint de status
 * @returns {Promise<{ statusData: any|null, latency: number }>}
 */
export async function getStatus(
  apiUrl,
  { timeout = 5000, endpoint = '/status' } = {}
) {
  // Garante URL sem barras duplicadas
  const url = `${apiUrl.replace(/\/+$/, '')}${endpoint}`;
  const controller = new AbortController();
  const startTime = performance.now();
  let latency = 0;

  // Programa abort após timeout
  const timerId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal
    });

    latency = Math.round(performance.now() - startTime);
    clearTimeout(timerId);

    if (!response.ok) {
      console.warn(`statusService.getStatus: resposta HTTP ${response.status}`);
      return { statusData: null, latency };
    }

    const statusData = await response.json();
    return { statusData, latency };

  } catch (err) {
    latency = Math.round(performance.now() - startTime);
    clearTimeout(timerId);

    if (err.name === 'AbortError') {
      console.warn(`statusService.getStatus: requisição abortada após ${timeout}ms`);
    } else {
      console.warn('statusService.getStatus: erro ao buscar status', err);
    }

    return { statusData: null, latency };
  }
}
