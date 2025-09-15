// core/policies/pt-first-vod.js
export const ptFirstVodPolicy = {
  id: 'pt-first-vod@1.0.0',
  evaluate: (stream) => {
    const lang = (stream.language || '').toLowerCase();
    const subs = Array.isArray(stream.subtitles) ? stream.subtitles : [];

    const hasPtAudio = ['pt', 'pt-pt', 'pt-br'].includes(lang);
    const hasPtSubs = subs.some(s => isPtLang(s.lang));

    if (hasPtAudio) {
      return { accept: true, reason: 'Tem áudio PT' };
    }

    if (hasPtSubs) {
      return { accept: true, reason: 'Tem legendas PT' };
    }

    return { accept: false, reason: 'Sem áudio ou legendas PT' };
  }
};

function isPtLang(lang) {
  const l = (lang || '').toLowerCase();
  return ['pt', 'pt-pt', 'pt-br', 'por', 'pob'].includes(l);
}
