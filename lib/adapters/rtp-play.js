/**
 * Adapter: RTP Play
 * Fonte: https://www.rtp.pt/play/
 * Token: Não
 * Última revisão: 2025-09-12
 */

import fetch from 'node-fetch';
import { createFallback } from '../utils/fallback.js';

export const rtpPlayAdapter = {
  id: 'rtp-play',

  async discover(config = {}) {
    const { limit = 5, language = 'pt' } = config;

    try {
      const res = await fetch(
        `https://www.rtp.pt/play/api/episodios/ultimos?limit=${encodeURIComponent(limit)}`
      );

      if (!res.ok) {
        throw new Error(`Falha ao obter conteúdos: ${res.status} ${res.statusText}`);
      }

      const episodes = await res.json();

      if (!Array.isArray(episodes) || episodes.length === 0) {
        throw new Error('Nenhum episódio encontrado na resposta da API.');
      }

      return episodes.slice(0, limit).map(ep => ({
        id: ep.id?.toString().trim() || '',
        name: ep.titulo?.trim() || 'Sem título',
        type: 'vod',
        url: ep.urlVideo?.trim() || '',
        canonicalUrl: ep.urlVideo?.trim() || '',
        language: language.toLowerCase().trim(),
        category: ep.programa?.trim() || 'RTP Play',
        media: {},
        subtitles: []
      }));

    } catch (err) {
      console.warn(`[RTP Play] Erro: ${err.message}`);
      return this.fallback();
    }
  },

  fallback() {
    return createFallback({
      id: 'demo-rtp-1',
      name: 'RTP Play Exemplo',
      type: 'vod',
      language: 'pt',
      category: 'Demo',
      url: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp1.smil/playlist.m3u8'
    });
  }
};
