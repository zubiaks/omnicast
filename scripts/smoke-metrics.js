// scripts/smoke-metrics.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { InfluxDB } from '@influxdata/influxdb-client';

// Carrega .env que já está na raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

async function run() {
  const url    = process.env.INFLUX_URL;
  const token  = process.env.INFLUX_TOKEN;
  const org    = process.env.INFLUX_ORG;
  const bucket = process.env.INFLUX_BUCKET;

  if (!url || !token || !org || !bucket) {
    console.error('❌ Variáveis de ambiente de InfluxDB faltando');
    process.exit(1);
  }

  const client   = new InfluxDB({ url, token });
  const queryApi = client.getQueryApi(org);
  const fluxQuery = `
    from(bucket:"${bucket}")
      |> range(start: -5m)
      |> limit(n:1)
  `;

  let found = false;
  for await (const _ of queryApi.iterateRows(fluxQuery)) {
    found = true;
    break;
  }

  if (!found) {
    console.error('❌ Nenhuma métrica encontrada nos últimos 5 minutos');
    process.exit(1);
  }

  console.log('✅ Métricas chegando normalmente no InfluxDB');
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
