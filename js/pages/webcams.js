import { showToast } from '@/utils/toast.js'

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
  const gridEl = container.querySelector('#webcams-grid')
  const playerEl = container.querySelector('#webcam-player')
  let cams = []
  let refreshInterval

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

    function refresh() {
      cams.forEach((c, i) => {
        const img = gridEl.querySelector(
          '.webcam-card[data-index="' + i + '"] .webcam-snapshot'
        )
        if (img) img.src = `${c.snapshotUrl}?t=${Date.now()}`
      })
      console.log('[Webcams] snapshots refreshed')
    }

    refreshInterval = setInterval(refresh, 30000)
    console.log('[Webcams] refreshInterval started')
  } catch (err) {
    console.error('[Webcams] fetch failed:', err)
    gridEl.textContent = 'Falha ao carregar webcams.'
    showToast(`Erro Webcams: ${err.message}`, 'error')
    return
  }

  gridEl.addEventListener('click', e => {
    const card = e.target.closest('.webcam-card')
    if (!card) return

    const cam = cams[+card.dataset.index]
    if (!cam.streamUrl) {
      console.warn('[Webcams] no streamUrl for', cam)
      return showToast('Nenhum stream disponível.', 'error')
    }

    playerEl.innerHTML = `
      <video controls autoplay style="width:100%;height:auto">
        <source src="${cam.streamUrl}" type="application/x-mpegURL" />
        Seu navegador não suporta esse formato.
      </video>
    `
    showToast(`Reproduzindo: ${cam.name}`, 'success')
  })

  console.log('[Webcams] renderWebcams end')

  return () => {
    clearInterval(refreshInterval)
    gridEl.removeEventListener('click', onGridClick)
  }
}
