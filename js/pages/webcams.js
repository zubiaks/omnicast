// js/pages/webcams.js
import { showToast } from '@/utils/toast.js'
import { loadHls } from '../hls-loader.js'

export async function renderWebcams(container) {
  console.log('[Webcams] renderWebcams start')

  container.innerHTML = `
    <section>
      <h2>Webcams</h2>
      <p>Confira as imagens ao vivo:</p>
      <div id="webcams-grid" class="webcams-grid">Carregando webcams...</div>
      <div id="webcam-player" class="webcam-player"></div>
    </section>
  `
  const gridEl     = container.querySelector('#webcams-grid')
  const playerEl   = container.querySelector('#webcam-player')
  let cams         = []
  let refreshTimer = null

  try {
    const res = await fetch('/data/webcams.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(res.statusText)
    cams = await res.json()
    console.log(`[Webcams] fetched ${cams.length} items`)
    showToast('Webcams carregadas!', 'success')

    gridEl.innerHTML = cams
      .map((c, i) => `
        <div class="webcam-card" data-index="${i}">
          <img class="webcam-snapshot" src="${c.snapshotUrl}" alt="${c.name}" />
          <div class="webcam-info">${c.name}</div>
        </div>
      `).join('')
  } catch (err) {
    console.error('[Webcams] fetch failed:', err)
    gridEl.textContent = 'Falha ao carregar webcams.'
    showToast(`Erro Webcams: ${err.message}`, 'error')
    return
  }

  function refreshSnapshots() {
    cams.forEach((c, i) => {
      const img = gridEl.querySelector(
        `.webcam-card[data-index="${i}"] .webcam-snapshot`
      )
      if (img) img.src = `${c.snapshotUrl}?t=${Date.now()}`
    })
    console.log('[Webcams] snapshots refreshed')
  }
  refreshTimer = setInterval(refreshSnapshots, 30_000)
  console.log('[Webcams] refreshInterval started')

  const onCardClick = async e => {
    const card = e.target.closest('.webcam-card')
    if (!card) return

    const cam = cams[+card.dataset.index]
    if (!cam.streamUrl) {
      console.warn('[Webcams] no streamUrl for', cam)
      return showToast('Nenhum stream disponível.', 'error')
    }

    gridEl.querySelectorAll('.webcam-card.active')
      .forEach(c => c.classList.remove('active'))
    card.classList.add('active')

    playerEl.innerHTML = `<video class="webcam-video" controls autoplay style="width:100%;height:auto"></video>`
    const video = playerEl.querySelector('video')

    if (cam.streamUrl.endsWith('.m3u8')) {
      const Hls = await loadHls()
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(cam.streamUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          console.error('[Webcams] HLS error:', data)
          showToast(`Stream error: ${data.type}`, 'error')
        })
      } else {
        video.src = cam.streamUrl
      }
    } else {
      video.src = cam.streamUrl
    }

    showToast(`Reproduzindo: ${cam.name}`, 'success')
  }

  gridEl.addEventListener('click', onCardClick)

  console.log('[Webcams] renderWebcams end')

  return () => {
    clearInterval(refreshTimer)
    gridEl.removeEventListener('click', onCardClick)
  }
}
