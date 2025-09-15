/**
 * Adapter: RadioBrowser
 * Fonte: https://api.radio-browser.info/json/stations
 * Token: Não
 * Última revisão: 2025-09-12
 */

import fetch from 'node-fetch';
import { createFallback } from '../utils/fallback.js';

export const radioBrowserAdapter = {
  id: 'radiobrowser',

  async discover(config = {}) {
    const { limit = 5, language = 'pt' } = config;

    try {
      const res = await fetch(
        `https://api.radio-browser.info/json/stations?limit=${encodeURIComponent(limit)}&hidebroken=true`
      );

      if (!res.ok) {
        throw new Error(`Falha ao obter rádios: ${res.status} ${res.statusText}`);
      }

      const stations = await res.json();

      if (!Array.isArray(stations) || stations.length === 0) {
        throw new Error('Nenhuma estação encontrada na resposta da API.');
      }

      return stations.slice(0, limit).map(st => ({
        id: st.stationuuid?.trim() || '',
        name: st.name?.trim() || 'Sem nome',
        type: 'radio',
        url: st.url_resolved?.trim() || '',
        canonicalUrl: st.url_resolved?.trim() || '',
        language: st.language?.toLowerCase().trim() || language,
        category: Array.isArray(st.tags)
          ? st.tags.join(', ').trim() || 'Radio'
          : (st.tags?.trim() || 'Radio'),
        media: {},
        subtitles: []
      }));

    } catch (err) {
      console.warn(`[RadioBrowser] Erro: ${err.message}`);
      return this.fallback();
    }
  },

  fallback() {
    return createFallback({
      id: 'demo-radio-1',
      name: 'Radio Exemplo',
      type: 'radio',
      language: 'pt',
      category: 'Demo',
      url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service'
    });
  }
};
