/**
 * Adapter: Pluto Live
 * Fonte: https://service-channels.clusters.pluto.tv/v2/guide
 * Token: Necessário (PLUTO_API_TOKEN no .env)
 * Última revisão: 2025-09-12
 */

import fetch from 'node-fetch';
import { createFallback } from '../utils/fallback.js';

export const plutoLiveAdapter = {
  id: 'pluto-live',

  async discover(config = {}) {
    const { limit = 5, language = 'en' } = config;
    const token = process.env.PLUTO_API_TOKEN || null;

    if (!token) {
      console.warn('[Pluto Live] Nenhum token definido — a usar fallback.');
      return this.fallback();
    }

    try {
      const res = await fetch(
        `https://service-channels.clusters.pluto.tv/v2/guide?lang=${encodeURIComponent(language)}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        throw new Error(`Falha ao obter canais: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const channels = Array.isArray(data) ? data : (Array.isArray(data.channels) ? data.channels : []);

      if (channels.length === 0) {
        throw new Error('Nenhum canal encontrado na resposta da API.');
      }

      return channels.slice(0, limit).map(ch => ({
        id: ch.id || '',
        name: ch.name?.trim() || 'Sem nome',
        type: 'live',
        url: ch.stitched?.urls?.[0]?.url?.trim() || '',
        canonicalUrl: ch.stitched?.urls?.[0]?.url?.trim() || '',
        language: ch.language?.toLowerCase().trim() || language,
        category: ch.category?.trim() || 'Live',
        media: {},
        subtitles: []
      }));

    } catch (err) {
      console.warn(`[Pluto Live] Erro: ${err.message}`);
      return this.fallback();
    }
  },

  fallback() {
    return createFallback({
      id: 'demo-live-1',
      name: 'Pluto Live Exemplo',
      type: 'live',
      language: 'en',
      category: 'Demo',
      url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8'
    });
  }
};
