// frontend/js/modules/media/favorites.js

import { eventBus } from '@modules/utils/eventBus.js'

/** Chave de armazenamento no localStorage */
export const FAVORITES_STORAGE_KEY    = 'oc:favorites'

/** Evento emitido quando favoritos mudam */
export const FAVORITES_CHANGE_EVENT   = 'favorites:changed'

/**
 * Carrega IDs de favoritos do localStorage como Set.
 * @returns {Set<string>}
 */
function loadFavoritesSet() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

/**
 * Persiste Set de favoritos no localStorage e emite evento global.
 * @param {Set<string>} favs
 */
function persistFavorites(favs) {
  try {
    const list = Array.from(favs)
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list))
    eventBus.emit(FAVORITES_CHANGE_EVENT, { favorites: list })
  } catch (err) {
    console.error('[favorites] falha ao salvar favoritos', err)
  }
}

/**
 * Retorna `true` se o ID estiver marcado como favorito.
 * @param {string} id
 * @returns {boolean}
 */
export function isFavorite(id) {
  return loadFavoritesSet().has(id)
}

/**
 * Alterna o status de favorito para um ID.
 * Adiciona se não existir, remove se existir.
 * Emite evento e retorna `true` se agora é favorito.
 * @param {string} id
 * @returns {boolean}
 */
export function toggleFavorite(id) {
  const favs = loadFavoritesSet()
  favs.has(id) ? favs.delete(id) : favs.add(id)
  persistFavorites(favs)
  return favs.has(id)
}

/**
 * Retorna array de todos os IDs favoritos.
 * @returns {string[]}
 */
export function getFavoriteIds() {
  return Array.from(loadFavoritesSet())
}

/**
 * Conta favoritos por tipo a partir da master list.
 * @param {Array<{id:string,type:string}>} masterList
 * @param {Set<string>} [favSet] — Set de favoritos (opcional)
 * @returns {Record<string, number>}
 */
export function countFavoritesByType(masterList, favSet = loadFavoritesSet()) {
  return masterList.reduce((counts, item) => {
    if (favSet.has(item.id)) {
      counts[item.type] = (counts[item.type] || 0) + 1
    }
    return counts
  }, {})
}

/**
 * Remove todos os favoritos e emite evento vazio.
 */
export function clearFavorites() {
  persistFavorites(new Set())
}
