// core/subtitles/translator.js
import fetch from 'node-fetch';

export const translatorProvider = {
  id: 'translator@1.1.0',

  /**
   * Traduz legendas para o idioma alvo
   * @param {Array<{lang: string, url: string}>} subtitles
   * @param {string} targetLang - Código ISO do idioma destino
   * @param {object} config - { apiUrl?: string, apiKey?: string, storageBaseUrl?: string, testMode?: boolean }
   * @returns {Promise<Array<{lang: string, url: string}>>}
   */
  async translate(subtitles, targetLang, config = {}) {
    const {
      apiUrl = null,
      apiKey = null,
      storageBaseUrl = 'https://cdn.omnicast.local/subs',
      testMode = false
    } = config;

    try {
      const validSubs = (subtitles || []).filter(
        s => s.url && s.url.startsWith('http')
      );

      if (validSubs.length === 0) {
        console.log('[Translator] Nenhuma legenda válida para traduzir.');
        return [];
      }

      console.log(`[Translator] Traduzindo ${validSubs.length} legendas para ${targetLang}`);

      if (testMode || !apiUrl) {
        console.log('[Translator] Modo de teste ativo ou API não configurada — simulação de tradução.');
        return validSubs.map(sub => ({
          ...sub,
          lang: targetLang,
          url: sub.url.replace(/\.srt$/i, `-${targetLang}.srt`)
        }));
      }

      // Exemplo de chamada real a API de tradução (depende do serviço escolhido)
      const results = [];
      for (const sub of validSubs) {
        const subRes = await fetch(sub.url);
        if (!subRes.ok) throw new Error(`Falha ao obter legenda: ${subRes.status} ${subRes.statusText}`);
        const subText = await subRes.text();

        const translatedText = await translateText(subText, targetLang, { apiUrl, apiKey });

        // Aqui poderias fazer upload para storage/CDN real
        const finalUrl = `${storageBaseUrl}/${Date.now()}-${targetLang}.srt`;

        results.push({ lang: targetLang, url: finalUrl });
      }

      return results;

    } catch (err) {
      console.error(`[Translator] Erro: ${err.message}`);
      return subtitles;
    }
  }
};

/**
 * Função auxiliar para traduzir texto usando API externa
 */
async function translateText(text, targetLang, { apiUrl, apiKey }) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({ q: text, target: targetLang })
  });

  if (!res.ok) throw new Error(`Falha na tradução: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.translatedText || text;
}
