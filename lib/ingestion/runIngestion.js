import { findAdapter, getValidatorFor, getSubtitleProviders } from '../../plugins/registry.js';
import { ptFirstVodPolicy } from '../policies/pt-first-vod.js';
import { processVodForQuarantine } from '../quarantine/vod-quarantine.js';
import { normalizeStream, dedupeStreams } from '../utils/normalizer.js';
import { insertStream } from '../db/streams.js';
import { getActiveSources } from '../db/sources.js';
import { validateStreamSchema } from '../validators/streamSchema.js'; // novo validador

export async function runIngestion() {
  const startTime = Date.now();
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'ingestion_start' }));

  const sources = await getActiveSources();
  let allNewStreams = [];

  // 1. Descoberta (paralela)
  const discoveryResults = await Promise.allSettled(
    sources.map(async src => {
      if (!src.adapterId) {
        console.warn(`Fonte ${src.name} sem adapterId definido`);
        return [];
      }
      const adapter = findAdapter(src.adapterId);
      if (!adapter) {
        console.warn(`Sem adapter para fonte ${src.name}`);
        return [];
      }
      const rawItems = await adapter.discover(src.config);
      console.log(`Fonte ${src.name}: ${rawItems.length} itens encontrados`);
      return rawItems;
    })
  );

  discoveryResults.forEach(r => {
    if (r.status === 'fulfilled') allNewStreams.push(...r.value);
    else console.error(`Erro na descoberta: ${r.reason?.message || r.reason}`);
  });

  // 2. Normalização
  let normalized = allNewStreams.map(normalizeStream);

  // 3. Deduplicação
  normalized = dedupeStreams(normalized);

  // Contadores
  let accepted = 0, quarantined = 0, rejected = 0;

  // 4. Validação técnica (paralela controlada)
  await Promise.allSettled(
    normalized.map(async rec => {
      try {
        const validator = getValidatorFor(rec);
        const result = await validator.validate(rec);
        rec.status = result.status;
        rec.score = result.score;
      } catch {
        rec.status = 'offline';
        rec.score = 0;
      }
    })
  );

  // 5. Processamento e inserção
  for (const rec of normalized) {
    try {
      if (rec.type === 'vod') {
        const decision = ptFirstVodPolicy.evaluate(rec);
        if (!decision.accept) {
          await processVodForQuarantine(rec);
          quarantined++;
          continue;
        }

        try {
          const [openSubtitles, translator, syncer] = getSubtitleProviders();
          const subs = await openSubtitles.fetchSubtitles(rec);
          const translated = await translator.translate(subs, 'pt');
          const syncedSubs = [];
          for (const sub of translated) {
            const syncResult = await syncer.sync(sub.url, rec);
            syncedSubs.push({ ...sub, url: syncResult.url, synced: syncResult.synced });
          }
          rec.subtitles = JSON.stringify(syncedSubs);
        } catch (err) {
          console.error(`Erro no processamento de legendas para ${rec.name}: ${err.message}`);
          rec.subtitles = JSON.stringify([]);
        }
      } else {
        rec.subtitles = JSON.stringify([]);
      }

      // 6. Validação de schema antes de inserir
      const valid = validateStreamSchema(rec);
      if (!valid) {
        console.warn(`Stream inválido: ${rec.name}`);
        rejected++;
        continue;
      }

      await insertStream(rec);
      accepted++;
    } catch (err) {
      console.error(`Erro ao processar stream ${rec.name}: ${err.message}`);
      rejected++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: 'ingestion_end',
    metrics: { accepted, quarantined, rejected, total: normalized.length, duration_s: duration }
  }));
}
