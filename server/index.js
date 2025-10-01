import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { recordRequest, flushMetrics } from './metrics.js'

dotenv.config()
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const app = express()
app.use(express.json())

// 1) Métricas aplicadas a todas as rotas
app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.once('finish', () => {
    const end = process.hrtime.bigint()
    const duration = Number(end - start) / 1e6
    recordRequest({
      route: req.route?.path || req.originalUrl,
      method: req.method,
      duration,
    })
  })
  next()
})

// 2) Health check ABERTO (sem autenticação)
app.get('/', (_req, res) => {
  res.send('OmniCast Streams API up 🚀')
})

// 3) Autenticação só para as rotas abaixo
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Token missing' })
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = user
  next()
})

// 4) Rotas PROTEGIDAS
const streams = [
  { id: 1, title: 'Canal A', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { id: 2, title: 'Canal B', url: 'https://test-streams.mux.dev/test_001/stream.m3u8' }
]

app.get('/streams', (req, res) => {
  res.json(streams)
})

// 5) Flush de métricas ao parar o processo
process.on('SIGINT', async () => {
  await flushMetrics()
  process.exit(0)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Streams API listening on port ${PORT}`)
})
