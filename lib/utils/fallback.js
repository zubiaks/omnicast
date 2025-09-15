/**
 * Gera um item de fallback padronizado para adapters do Omnicast.
 * Útil quando a API real não responde ou não há dados disponíveis.
 *
 * @param {Object} options - Opções para personalizar o fallback
 * @param {string} [options.id='demo-item-1'] - ID único do item
 * @param {string} [options.name='Título de Exemplo'] - Nome/título do item
 * @param {string} [options.type='vod'] - Tipo de conteúdo ('vod', 'live', 'radio', etc.)
 * @param {string} [options.url] - URL do stream ou ficheiro
 * @param {string} [options.language='en'] - Código ISO da língua
 * @param {string} [options.category='Demo'] - Categoria ou origem
 * @param {Array}  [options.subtitles] - Lista de legendas [{ lang, url }]
 * @param {Object} [options.media={}] - Metadados adicionais (thumbs, duração, etc.)
 * @returns {Array} Array com um único objeto de fallback
 * Última revisão: 2025-09-12
 */
export function createFallback({
  id = 'demo-item-1',
  name = 'Título de Exemplo',
  type = 'vod',
  url = 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
  language = 'en',
  category = 'Demo',
  subtitles = [
    {
      lang: 'en',
      url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/angel-one-en.vtt'
    }
  ],
  media = {}
} = {}) {
  return [
    {
      id: String(id).trim(),
      name: String(name).trim(),
      type: String(type).toLowerCase().trim(),
      url: String(url).trim(),
      canonicalUrl: String(url).trim(),
      language: String(language).toLowerCase().trim(),
      category: String(category).trim(),
      media: typeof media === 'object' && media !== null ? media : {},
      subtitles: Array.isArray(subtitles) ? subtitles : []
    }
  ];
}
