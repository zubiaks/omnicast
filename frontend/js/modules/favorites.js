// assets/js/modules/favorites.js

/**
 * Gerencia favoritos de forma centralizada usando localStorage.
 */

const STORAGE_KEY = 'oc:favs';
let cache = null;

/**
 * Carrega o conjunto de favoritos do localStorage (cachê em memória).
 *
 * @returns {Set<string>}
 */
function loadFavorites() {
  if (cache) {
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const arr = JSON.parse(raw);
    cache = new Set(Array.isArray(arr) ? arr : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

/**
 * Persiste o conjunto de favoritos no localStorage e dispara evento.
 *
 * @param {Set<string>} favs
 */
function saveFavorites(favs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
    document.dispatchEvent(
      new CustomEvent('favoritesChanged', { detail: [...favs] })
    );
  } catch (err) {
    console.error('[favorites] Falha ao salvar favoritos:', err);
  }
}

/**
 * Retorna se o id está marcado como favorito.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function isFavorite(id) {
  return loadFavorites().has(id);
}

/**
 * Adiciona um id aos favoritos (se não existir) ou remove (se existir).
 *
 * @param {string} id
 * @returns {boolean} — novo estado de favorito (true = favoritado)
 */
export function toggleFavorite(id) {
  const favs = loadFavorites();
  if (favs.has(id)) {
    favs.delete(id);
  } else {
    favs.add(id);
  }
  saveFavorites(favs);
  return favs.has(id);
}

/**
 * Obtém todos os IDs atualmente favoritados.
 *
 * @returns {string[]}
 */
export function getFavoriteIds() {
  return [...loadFavorites()];
}

/**
 * Conta quantos favoritos existem em cada tipo, dado um masterList.
 *
 * @param {Array<{ id: string, type: string }>} masterList
 * @returns {{ [type: string]: number }}
 */
export function countFavoritesByType(masterList) {
  const favs = loadFavorites();
  return masterList.reduce((counts, item) => {
    if (favs.has(item.id)) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, {});
}

/**
 * Remove todos os favoritos.
 */
export function clearFavorites() {
  cache = new Set();
  saveFavorites(cache);
}
