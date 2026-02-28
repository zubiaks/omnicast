// web/js/utils/fetch.js
/**
 * Faz uma requisição e parseia JSON, lançando erro em HTTP ≥400.
 * @param {string} url       URL ou endpoint a ser chamado.
 * @param {RequestInit=} init Opções de fetch (headers, method, cache etc).
 * @returns {Promise<any>}    Resposta JSON parseada.
 */
export async function fetchJSON(url, init = {}) {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`Falha ao buscar ${url}: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
