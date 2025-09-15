import { getQuarantineItems, removeFromQuarantine, saveToQuarantine } from '../db/quarantine.js';
import { insertStream } from '../db/streams.js';
import { ptFirstVodPolicy } from '../policies/pt-first-vod.js';
import { subtitleProviders } from '../plugins/registry.js';

const TARGET_LANG = process.env.SUBTITLE_TARGET_LANG || 'pt-PT';
const MAX_PER_RUN = parseInt(process.env.REPROCESS_MAX_PER_RUN || '250', 10);
const CONCURRENCY = parseInt(process.env.REPROCESS_CONCURRENCY || '5', 10);

export async function reprocessQuarantineJob() {
  const start = Date.now();
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'quarantine_reprocess_start', targetLang: TARGET_LANG }));

  let items = await getQuarantineItems('vod');
  if (items.length === 0) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'no_items' }));
    return;
  }

  if (items.length > MAX_PER_RUN) {
    items = items.slice(0, MAX_PER_RUN);
    console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'limit_applied', count: MAX_PER_RUN }));
  }

  let processed = 0, released = 0, kept = 0, failed = 0;

  // Processamento em lotes com concorrência controlada
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(async original => {
      const itemStart = Date.now();
      let updated = normalizeQuarantineItem(original);

      try {
        let ptSub = await findDirectPtSubtitle(updated);

        if (!ptSub) {
          ptSub = await translateFirstAvailableSubtitle(updated, TARGET_LANG);
          if (ptSub) {
            updated.subtitles.push(ptSub);
            logEvent('subtitle_translated', updated, { lang: TARGET_LANG });
          }
        } else {
          const exists = updated.subtitles.some(s => s.url === ptSub.url);
          if (!exists) updated.subtitles.push(ptSub);
          logEvent('subtitle_found', updated, { lang: ptSub.lang });
        }

        if (ptSub && !ptSub.synced) {
          const synced = await syncSubtitle(ptSub, updated);
          if (synced?.synced) {
            updated.subtitles = updated.subtitles.map(s =>
              s.url === ptSub.url ? { ...s, url: synced.url, synced: true } : s
            );
            logEvent('subtitle_synced', updated);
          }
        }

        const decision = ptFirstVodPolicy.evaluate(updated);
        if (decision.accept) {
          await removeFromQuarantine(updated.id);
          await insertStream(updated);
          released++;
          logEvent('released', updated, { reason: decision.reason, duration_ms: Date.now() - itemStart });
        } else {
          await saveToQuarantine({
            ...updated,
            quarantineReason: decision.reason,
            policyVersion: ptFirstVodPolicy.id
          });
          kept++;
          logEvent('kept', updated, { reason: decision.reason, duration_ms: Date.now() - itemStart });
        }
        processed++;
      } catch (err) {
        failed++;
        logEvent('error', updated, { error: err.message });
      }
    }));
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: 'quarantine_reprocess_end',
    metrics: { processed, released, kept, failed, total: items.length, duration_ms: Date.now() - start }
  }));
}

function normalizeQuarantineItem(item) {
  const subtitles = Array.isArray(item.subtitles) ? item.subtitles : [];
  return { ...item, subtitles };
}

async function findDirectPtSubtitle(stream) {
  for (const provider of subtitleProviders) {
    if (typeof provider.find !== 'function') continue;
    try {
      const subs = await provider.find(stream);
      const ptSubs = (subs || []).filter(s => isPtLang(s.lang));
      const best = pickBestPtSubtitle(ptSubs);
      if (best) return best;
    } catch (err) {
      logEvent('provider_find_error', stream, { provider: provider.id, error: err.message });
    }
  }
  return null;
}

async function translateFirstAvailableSubtitle(stream, targetLang) {
  const existing = (stream.subtitles || []).filter(Boolean);
  if (existing.length === 0) return null;

  const sourceSub = pickBestSourceSubtitle(existing);
  if (!sourceSub) return null;

  for (const provider of subtitleProviders) {
    if (typeof provider.translate !== 'function') continue;
    try {
      const translated = await provider.translate(sourceSub.url, targetLang);
      if (translated) {
        return { ...translated, lang: targetLang, source: provider.id || 'auto-translate', translated: true, synced: false };
      }
    } catch (err) {
      logEvent('provider_translate_error', stream, { provider: provider.id, error: err.message });
    }
  }
  return null;
}

async function syncSubtitle(ptSub, stream) {
  for (const provider of subtitleProviders) {
    if (typeof provider.sync !== 'function') continue;
    try {
      const result = await provider.sync(ptSub.url, stream);
      if (result?.synced) return { url: result.url, synced: true };
    } catch (err) {
      logEvent('provider_sync_error', stream, { provider: provider.id, error: err.message });
    }
  }
  return { url: ptSub.url, synced: false };
}

function isPtLang(lang) {
  const l = (lang || '').toLowerCase();
  return ['pt', 'pt-pt', 'pt-br', 'por', 'pob'].includes(l);
}

function pickBestPtSubtitle(ptSubs) {
  if (!ptSubs?.length) return null;
  const priority = (lang) => {
    const l = (lang || '').toLowerCase();
    if (l === 'pt-pt') return 3;
    if (l === 'pt-br') return 2;
    if (l === 'pt') return 1;
    return 0;
  };
  return [...ptSubs].sort((a, b) => priority(b.lang) - priority(a.lang))[0];
}

function pickBestSourceSubtitle(subs) {
  if (!subs?.length) return null;
  const score = (s) => {
    let sc = 0;
    const l = (s.lang || '').toLowerCase();
    if (['en', 'eng'].includes(l)) sc += 3;
    if (['es', 'spa', 'es-la'].includes(l)) sc += 2;
    if (['fr', 'fra'].includes(l)) sc += 1;
    if (/hearing|sdh|hi/i.test(s.label || '')) sc -= 2;
    return sc;
  };
  return [...subs].sort((a, b) => score(b) - score(a))[0];
}

function logEvent(event, stream, extra = {}) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event,
    streamId: stream?.id,
    streamName: stream?.name,
    ...extra
  }));
}

export default reprocessQuarantineJob;
