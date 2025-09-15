/**
 * Adapter: Pluto VOD
 * Fonte: https://service-vod.clusters.pluto.tv/v4/vod/categories
 * Token: Necessário (PLUTO_API_TOKEN no .env)
 * Última revisão: 2025-09-12
 */

import fetch from 'node-fetch';
import { createFallback } from '../utils/fallback.js';

export const plutoVodAdapter = {
  id: 'pluto-vod',

  async discover(config = {}) {
    const { limit = 5, language = 'en', categoryName = null } = config;
    const token = process.env.PLUTO_API_TOKEN || null;

    if (!token) {
      console.warn('[Pluto VOD] Nenhum token definido — a usar fallback.');
      return this.fallback();
    }

    try {
      const res = await fetch('https://service-vod.clusters.pluto.tv/v4/vod/categories', {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': `${language},en;q=0.9`,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Falha ao obter dados: ${res.status} ${res.statusText}`);
      }

      const categories = await res.json();

      if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error('Resposta inválida ou sem categorias.');
      }

      const targetCat = categoryName
        ? categories.find(cat => cat.name?.toLowerCase().trim() === categoryName.toLowerCase().trim())
        : categories.find(cat => Array.isArray(cat.items) && cat.items.length > 0);

      if (!targetCat || !Array.isArray(targetCat.items) || targetCat.items.length === 0) {
        throw new Error('Nenhuma categoria com items encontrada.');
      }

      return targetCat.items.slice(0, limit).map(v => ({
        id: v.id?.trim() || '',
        name: v.name?.trim() || 'Sem título',
        type: 'vod',
        url: v.clip?.url?.trim() || '',
        canonicalUrl: v.clip?.url?.trim() || '',
        language: v.language?.toLowerCase().trim() || language,
        category: targetCat.name?.trim() || '',
        media: {},
        subtitles: Array.isArray(v.subtitles) ? v.subtitles : []
      }));

    } catch (err) {
      console.warn(`[Pluto VOD] Erro: ${err.message}`);
      return this.fallback();
    }
  },

  fallback() {
    return createFallback({
      id: 'demo-vod-1',
      name: 'Pluto VOD Exemplo',
      type: 'vod',
      language: 'en',
      category: 'Demo',
      url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
      subtitles: [
        {
          lang: 'en',
          url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/angel-one-en.vtt'
        }
      ]
    });
  }
};
