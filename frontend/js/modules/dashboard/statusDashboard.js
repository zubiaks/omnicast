// frontend/js/modules/dashboard/statusDashboard.js

import { configManager }        from '@modules/config/configManager.js'
import { showToast }            from '@modules/ui/alerts.js'
import { escapeHtml }           from '@modules/utils/ocUtils.js'

/** Evento para iniciar/parar auto‐refresh */
const CONFIG_KEY = 'statusPollingMs'

/**
 * Inicializa o painel de status de serviços:
 * - Indicadores resumidos (badge, total, online, offline)
 * - Tabela detalhada e JSON cru
 * - Auto‐refresh configurável
 *
 * @param {Object} opts
 * @param {Object<string, string|HTMLElement>} opts.selectors
 * @param {Object} [opts.config]
 * @returns {{
 *   loadAndRender: () => Promise<void>,
 *   startAutoRefresh: () => void,
 *   stopAutoRefresh: () => void
 * }}
 */
export function initStatusDashboard({
  selectors = {},
  config    = {}
} = {}) {
  // Carrega configuração do usuário
  const userCfg = configManager.loadConfig()

  // Define paths e intervalo, respeitando config passada e defaults
  const pollingMs        = config.pollingMs        ?? userCfg.statusPollingMs        ?? 10000
  const historyIndexPath = config.historyIndexPath ?? userCfg.statusHistoryIndexPath ?? '/assets/data/lista_historicos.json'
  const defaultDataPath  = config.defaultDataPath  ?? userCfg.statusDefaultDataPath  ?? '/assets/data/status.json'

  // Resolve elementos do DOM
  const el = {}
  ;[
    'dot','last','summary','sumTotal','sumOnline','sumOffline',
    'tbody','rawSection','raw','err','btnRefresh','chkAuto'
  ].forEach(key => {
    const sel = selectors[key]
    el[key] = sel
      ? (typeof sel === 'string' ? document.querySelector(sel) : sel)
      : null
  })

  let timerId = null

  // Cores por status
  const statusColors = {
    ok:   'var(--ok)',
    warn: 'var(--warn)',
    err:  'var(--err)'
  }

  // Converte timestamp para string legível
  const fmtDate = ts => {
    if (!ts) return '—'
    try { return new Date(ts).toLocaleString() }
    catch { return String(ts) }
  }

  /** Busca JSON com bust de cache */
  async function fetchJson(path) {
    const url = `${path}?_=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  /** Resolve o caminho do JSON mais recente via histórico */
  async function resolveDataPath() {
    try {
      const history = await fetchJson(historyIndexPath)
      if (Array.isArray(history) && history.length) {
        const latest = history.sort().pop()
        return historyIndexPath.replace(/[^\/]+$/, latest)
      }
    } catch {
      // ignorar e usar fallback
    }
    return defaultDataPath
  }

  /** Normaliza formato de dados para lista de serviços */
  function normalizeData(raw) {
    let items = []
    if (Array.isArray(raw)) items = raw
    else if (Array.isArray(raw.streams)) items = raw.streams
    else if (Array.isArray(raw.items))   items = raw.items
    else if (raw && typeof raw === 'object') {
      items = Object.entries(raw).map(([name, data]) => ({ name, ...(data||{}) }))
    }
    return items.map(it => ({
      name:       it.name || it.titulo || it.id || '—',
      status:     String(it.status || it.state || '').toLowerCase(),
      message:    it.message || it.msg || '',
      updated_at: it.updated_at || it.at || it.timestamp || null
    }))
  }

  /** Atualiza resumo: total, online, offline e badge colorido */
  function renderSummary(list) {
    if (!el.summary) return
    const total   = list.length
    const online  = list.filter(i => i.status.includes('on')).length
    const offline = total - online

    el.sumTotal.textContent   = `${total}`
    el.sumOnline.textContent  = `${online}`
    el.sumOffline.textContent = `${offline}`
    el.summary.classList.toggle('hide', total === 0)

    const badge = offline === 0 ? 'ok' : (online > 0 ? 'warn' : 'err')
    if (el.dot) {
      el.dot.style.background = statusColors[badge]
    }
  }

  /** Popula a tabela de status com linhas HTML */
  function renderTable(list) {
    if (!el.tbody) return
    if (!list.length) {
      el.tbody.innerHTML = `
        <tr>
          <td colspan="4" class="muted center">Sem dados</td>
        </tr>
      `
      return
    }

    el.tbody.innerHTML = list.map(it => {
      const badge = it.status.includes('on')
        ? 'ok'
        : (it.status.includes('off') || it.status.includes('fail') ? 'err' : 'warn')

      return `
        <tr>
          <td>${escapeHtml(it.name)}</td>
          <td><span class="badge ${badge}">${escapeHtml(it.status)}</span></td>
          <td>${escapeHtml(it.message)}</td>
          <td>${escapeHtml(fmtDate(it.updated_at))}</td>
        </tr>
      `
    }).join('')
  }

  /** Exibe JSON cru formatado */
  function renderRaw(raw) {
    if (!el.raw) return
    el.raw.textContent = JSON.stringify(raw, null, 2)
    el.rawSection?.classList.remove('hide')
  }

  /** Exibe mensagem de erro */
  function showError(message) {
    if (!el.err) return
    el.err.textContent = `Erro: ${message}`
    el.err.classList.remove('hide')
    if (el.dot) el.dot.style.background = statusColors.err
  }

  /** Limpa estado de erro */
  function hideError() {
    if (!el.err) return
    el.err.textContent = ''
    el.err.classList.add('hide')
  }

  /** Busca dados e dispara renderizações */
  async function loadAndRender() {
    hideError()
    try {
      const path = await resolveDataPath()
      const raw  = await fetchJson(path)
      if (el.last) {
        el.last.textContent = fmtDate(raw.generated_at || raw.timestamp || Date.now())
      }
      const list = normalizeData(raw)
      renderSummary(list)
      renderTable(list)
      renderRaw(raw)
    } catch (err) {
      console.error('[statusDashboard]', err)
      showError(err.message || String(err))
      showToast('Falha ao carregar status.', { type: 'critical' })
    }
  }

  /** Inicia auto‐refresh periódico */
  function startAutoRefresh() {
    stopAutoRefresh()
    timerId = setInterval(loadAndRender, pollingMs)
  }

  /** Para auto‐refresh */
  function stopAutoRefresh() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  // Eventos de UI
  el.btnRefresh?.addEventListener('click', loadAndRender)
  el.chkAuto?.addEventListener('change', e =>
    e.target.checked ? startAutoRefresh() : stopAutoRefresh()
  )

  // Primeira carga e auto‐refresh se ativado
  loadAndRender()
  if (el.chkAuto?.checked) {
    startAutoRefresh()
  }

  return { loadAndRender, startAutoRefresh, stopAutoRefresh }
}
