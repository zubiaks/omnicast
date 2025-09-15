// core/subtitles/opensubtitles.js
import fetch from 'node-fetch';

export const openSubtitlesProvider = {
  id: 'opensubtitles@1.1.0',

  /**
   * Procura legendas para um stream no OpenSubtitles
   * @param {object} stream - StreamRecord com info do vídeo
   * @param {object} config - { apiKey: string, lang?: string, testMode?: boolean }
   * @returns {Promise<Array<{lang: string, url: string}>>}
   */
  async fetchSubtitles(stream, config = {}) {
    const { apiKey = process.env.OPENSUBTITLES_API_KEY, lang, testMode = false } = config;

    try {
      if (!stream?.name) {
        console.warn('[OpenSubtitles] Stream sem nome, não é possível procurar legendas.');
        return [];
      }

      console.log(`[OpenSubtitles] Procurando legendas para "${stream.name}"`);

      // Se já houver legendas reais no stream, não tenta buscar mais
      if (Array.isArray(stream.subtitles) && stream.subtitles.length > 0) {
        console.log('[OpenSubtitles] Stream já tem legendas, a ignorar busca.');
        return [];
      }

      if (testMode) {
        console.log('[OpenSubtitles] Modo de teste ativo — a devolver legendas de exemplo.');
        return [
          { lang: 'en', url: 'https://example.com/subs/demo-en.vtt' },
          { lang: 'pt', url: 'https://example.com/subs/demo-pt.vtt' }
        ];
      }

      if (!apiKey) {
        console.warn('[OpenSubtitles] API key não definida, não é possível buscar legendas reais.');
        return [];
      }

      const queryParams = new URLSearchParams({ query: stream.name });
      if (lang) queryParams.set('languages', lang);

      const res = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?${queryParams.toString()}`, {
        headers: { 'Api-Key': apiKey }
      });

      if (!res.ok) {
        throw new Error(`Falha ao obter legendas: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return (data.data || []).map(sub => ({
        lang: sub.attributes.language,
        url: sub.attributes.url
      }));

    } catch (err) {
      console.error(`[OpenSubtitles] Erro: ${err.message}`);
      return [];
    }
  }
};
