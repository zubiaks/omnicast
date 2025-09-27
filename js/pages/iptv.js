// js/pages/iptv.js
import { loadHls } from '../hls-loader.js'
import { showToast } from '@/utils/toast.js'

export async function renderIptv(container) {
  console.log('[IPTV] renderIptv start')

  container.innerHTML = `
    <section>
      <h2>IPTV</h2>
      <p>Selecione um canal para iniciar a transmissão:</p>
      <div id="iptv-list">Carregando canais...</div>
      <div id="iptv-player" class="iptv-player"></div>
    </section>
  `
  const listEl   = container.querySelector('#iptv-list')
  const playerEl = container.querySelector('#iptv-player')
  let hlsInstance

  try {
    const res = await fetch('/data/iptv-channels.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(res.statusText)
    const channels = await res.json()
    console.log(`[IPTV] fetched ${channels.length} channels`)

    listEl.innerHTML = channels
      .map(ch => `<button class="iptv-channel-btn" data-url="${ch.streamUrl}">${ch.name}</button>`)
      .join('')
    showToast('Canais IPTV carregados com sucesso!', 'success')
  } catch (err) {
    console.error('[IPTV] fetch failed:', err)
    listEl.textContent = 'Falha ao carregar canais.'
    showToast(`Erro ao carregar IPTV: ${err.message}`, 'error')
    return
  }

  const onChannelClick = async e => {
    const btn = e.target.closest('.iptv-channel-btn')
    if (!btn) return

    const url  = btn.dataset.url
    const name = btn.textContent
    console.log('[IPTV] channel selected:', name, url)

    listEl.querySelectorAll('.iptv-channel-btn.active')
      .forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    playerEl.innerHTML = `<video id="iptv-video" controls autoplay style="width:100%;height:100%"></video>`
    const video = playerEl.querySelector('#iptv-video')

    if (hlsInstance) {
      hlsInstance.destroy()
      hlsInstance = null
    }

    const Hls = await loadHls()
    if (Hls.isSupported()) {
      hlsInstance = new Hls({ debug: false })
      hlsInstance.loadSource(url)
      hlsInstance.attachMedia(video)
      hlsInstance.on(Hls.Events.ERROR, (_evt, data) => {
        console.error('[IPTV] HLS error:', data)
        showToast(`Stream error: ${data.type}`, 'error')
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.addEventListener('error', () => {
        console.error('[IPTV] native video error')
        showToast('Erro ao reproduzir stream', 'error')
      })
    } else {
      showToast('HLS não é suportado neste navegador', 'error')
    }

    showToast(`Reproduzindo: ${name}`, 'success')
  }

  listEl.addEventListener('click', onChannelClick)

  console.log('[IPTV] renderIptv end')

  return () => {
    listEl.removeEventListener('click', onChannelClick)
    if (hlsInstance) hlsInstance.destroy()
  }
}
