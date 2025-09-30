const express = require('express')
const bodyParser = require('body-parser')
const { InfluxDB, Point } = require('@influxdata/influxdb-client')

const INFLUX_URL   = process.env.INFLUX_URL   || 'http://localhost:8086'
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || '<INFLUX_TOKEN>'
const INFLUX_ORG   = process.env.INFLUX_ORG   || 'my-org'
const INFLUX_BUCKET= process.env.INFLUX_BUCKET|| 'metrics'

const influx    = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN })
const writeApi  = influx.getWriteApi(INFLUX_ORG, INFLUX_BUCKET)

const app = express()
app.use(bodyParser.json())

app.post('/api/metrics', (req, res) => {
  const { name, value, href, timestamp } = req.body
  const path = new URL(href).pathname

  const point = new Point(name)
    .floatField('value', value)
    .tag('path', path)
    .timestamp(new Date(timestamp))

  writeApi.writePoint(point)
  res.status(204).end()
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Metrics collector listening on :${PORT}`))
