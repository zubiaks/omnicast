import crypto from 'crypto';
import { URL } from 'url';

export function normalizeStream(raw) {
  const rec = { ...raw };

  if (!rec.id) {
    rec.id = crypto.randomUUID();
  }

  if (rec.name) {
    rec.name = rec.name.trim()
      .replace(/\s+/g, ' ')
      .replace(/\b(HD|FHD|4K)\b\s*$/i, '') // remove HD/FHD/4K no fim
      .replace(/[

\[\(]\s*(HD|FHD|4K)\s*[\]

\)]$/i, '') // remove (HD) ou [HD]
      .trim();
  } else {
    rec.name = 'Sem Nome';
  }

  if (!rec.type) rec.type = 'iptv';
  rec.type = rec.type.toLowerCase();

  if (rec.canonicalUrl) {
    rec.canonicalUrl = canonicalizeUrl(rec.canonicalUrl);
  } else if (rec.url) {
    rec.canonicalUrl = canonicalizeUrl(rec.url);
  }
  if (!rec.canonicalUrl) rec.canonicalUrl = '';

  rec.country = rec.country ? rec.country.toLowerCase() : null;
  rec.language = rec.language ? rec.language.toLowerCase() : null;
  if (!rec.category) rec.category = 'Desconhecido';

  if (!rec.media) rec.media = { formats: [] };
  if (!Array.isArray(rec.subtitles)) rec.subtitles = [];

  return rec;
}

function canonicalizeUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    u.hash = '';
    const params = [...u.searchParams.entries()]
      .filter(([k]) => !['token', 'auth', 'session', 'sig', 'expires'].includes(k.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b));
    u.search = params.length ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&') : '';
    return u.toString();
  } catch {
    console.warn(`URL inválida: ${urlStr}`);
    return urlStr;
  }
}

export function dedupeStreams(streams) {
  const seen = new Map();
  const result = [];

  for (const rec of streams) {
    const key = `${rec.canonicalUrl || ''}::${rec.name.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(rec);
    }
  }
  return result;
}
