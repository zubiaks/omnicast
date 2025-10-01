// server/metrics.js
import { InfluxDB, Point } from '@influxdata/influxdb-client'

const url     = process.env.INFLUX_URL
const token   = process.env.INFLUX_TOKEN
const org     = process.env.INFLUX_ORG    || 'omnicast'
const bucket  = process.env.INFLUX_BUCKET || 'metrics'

const influx   = new InfluxDB({ url, token })
const writeApi = influx.getWriteApi(org, bucket)

/**
 * Registra uma métrica de requisição HTTP.
 */
export function recordRequest({ route, method, duration }) {
  const point = new Point('http_request')
    .tag('route', route)
    .tag('method', method)
    .floatField('duration_ms', duration)
  writeApi.writePoint(point)
}

/**
 * Fecha a conexão com o InfluxDB e garante flush dos pontos em buffer.
 */
export async function flushMetrics() {
  try {
    await writeApi.close()
    console.log('✅ Métricas enviadas ao InfluxDB.')
  } catch (err) {
    console.error('❌ Erro ao fechar InfluxDB writeApi:', err)
  }
}
