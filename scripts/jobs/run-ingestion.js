import runIngestion from '../../lib/ingestion/runIngestion.js';

(async () => {
  await runIngestion({ type: process.argv[2] || 'all' });
})();

