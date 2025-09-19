// frontend/js/pages/radio.js

import { initTheme }              from '@modules/ui/themeManager.js'
import { initDisplaySettings }    from '@modules/ui/displaySettings.js'
import { initUiControls }         from '@modules/ui/uiControls.js'
import { showToast }              from '@modules/ui/alerts.js'

import { initPwaUpdater }         from '@modules/network/pwaUpdater.js'
import { initOfflineHandler }     from '@modules/network/offlineHandler.js'

import { configManager }          from '@modules/config/configManager.js'
import { validateStream }         from '@modules/utils/validator-core.js'

/**
 * Inicializa a página de Rádio:
 * • Aplica tema, display e controles de UI
 * • Exibe banner PWA e handle offline
 * • Carrega status de rádios via JSON com fallback
 * • Roda validação de stream se configurado
 * • Renderiza tabela e atualiza “Última”
 *
 * @returns {() => void} Função para limpar o auto-refresh
 */
export function initRadioPage() {
  // 1) Inicia tema, display e UI
  initTheme()
  initDisplaySettings()
  initUiControls()

  // 2) PWA update banner e offline handler
  const { updateAlert } = configManager.loadConfig()
  initPwaUpdater({ updateAlert })
  initOfflineHandler()

  // 3) Seleciona elementos
  const tbody        = document.querySelector('#radiosTable tbody')
  const lastUpdateEl = document.getElementById('lastUpdate')
  const refreshMs    = configManager.loadConfig().radioRefreshMs ?? 30000

  if (!tbody || !lastUpdateEl) {
    console.warn('[radio] tabela de rádios ou elemento de “Última” não encontrados.')
    return () => {}
  }

  /** Exibe uma mensagem única na tabela */
  function setTableMessage(message, cssClass = '') {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="${cssClass}">${message}</td>
      </tr>
    `
  }

  /** Renderiza linhas da tabela a partir dos dados */
  function renderTable(radios) {
    tbody.textContent = ''
    const frag = document.createDocumentFragment()

    radios.forEach(radio => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${radio.Nome || ''}</td>
        <td class="${radio.Estado === 'online' ? 'online' : 'offline'}">
          ${radio.Estado || ''}
        </td>
        <td>${radio.Pontuação ?? ''}</td>
        <td>${radio['Tempo de Resposta'] ?? ''}</td>
        <td>${radio.Bitrate ?? ''}</td>
        <td>${radio.Género ?? ''}</td>
        <td>${radio['Música Atual'] ?? ''}</td>
      `
      frag.appendChild(tr)
    })

    tbody.appendChild(frag)

    const offlineCount = radios.filter(r => r.Estado !== 'online').length
    if (offlineCount) {
      console.group(`[radio] Offline (${offlineCount})`)
      radios.filter(r => r.Estado !== 'online')
            .forEach(r => console.warn(`${r.Nome || '—'}: ${r.Estado}`))
      console.groupEnd()
    }
  }

  /** Faz fetch de JSON, aborta cache e lança erro se falhar */
  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  /** Carrega dados e atualiza a UI, com fallback e validação */
  async function loadAndRender() {
    setTableMessage('Carregando…')

    let data
    try {
      data = await fetchJson('/assets/data/status.json')
    } catch {
      console.warn('[radio] status.json falhou, usando backup')
      try {
        data = await fetchJson('/assets/data/status_backup.json')
      } catch (err) {
        console.error('[radio] falha no backup:', err)
        setTableMessage('Erro ao carregar dados', 'offline')
        lastUpdateEl.textContent = '—'
        showToast('Não foi possível carregar as rádios.', { type: 'critical' })
        return
      }
    }

    let radios = Array.isArray(data.radios) ? data.radios : []

    if (configManager.loadConfig().validateStreams) {
      const settled = await Promise.allSettled(
        radios.map(item =>
          validateStream(item).then(res => ({ ...item, Estado: res.online ? 'online' : 'offline' }))
        )
      )
      radios = settled
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
    }

    if (!radios.length) {
      setTableMessage('Nenhuma rádio disponível', 'muted')
      lastUpdateEl.textContent = '—'
    } else {
      renderTable(radios)
      const ts = data.generated_at || data.timestamp || Date.now()
      lastUpdateEl.textContent = new Date(ts).toLocaleTimeString()
    }
  }

  // Primeira execução e agendamento de auto-refresh
  loadAndRender()
  const timerId = setInterval(loadAndRender, refreshMs)
  return () => clearInterval(timerId)
}

// Auto-bootstrap se detectar a tabela de rádios
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#radiosTable')) {
    initRadioPage()
  }
})
