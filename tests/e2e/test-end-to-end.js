import './bootstrap.js';
import { findAdapter, getValidatorFor, getSubtitleProviders } from './registry.js';

async function testAdapter(adapterId, config = {}) {
  const adapter = findAdapter(adapterId);
  if (!adapter) {
    console.warn(`[TEST] Adapter não encontrado: ${adapterId}`);
    return;
  }

  console.log(`\n=== [TEST] Adapter: ${adapterId} ===`);
  const streams = await adapter.discover(config);

  for (const stream of streams) {
    console.log(`\n[TEST] Stream: ${stream.name} (${stream.type})`);
    const validator = getValidatorFor(stream);
    if (!validator) {
      console.warn('[TEST] Nenhum validador encontrado.');
      continue;
    }
    const validation = await validator.validate(stream, { testMode: true });
    console.log(`[TEST] Validação:`, validation);

    if (stream.type === 'vod') {
      const providers = getSubtitleProviders();
      let subs = [];
      for (const provider of providers) {
        if (provider.fetchSubtitles) {
          const found = await provider.fetchSubtitles(stream, { testMode: true });
          subs = subs.concat(found);
          console.log(`[TEST] ${provider.id} encontrou ${found.length} legendas`);
        }
      }
    }
  }
}

const adaptersToTest = ['pluto-vod', 'radiobrowser', 'rtp-play'];

(async () => {
  for (const adapterId of adaptersToTest) {
    await testAdapter(adapterId);
  }
  console.log('\n[TEST] Fim dos testes end-to-end.');
})();
