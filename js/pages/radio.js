// js/pages/radio.js
import { showToast } from '@/utils/toast.js'

export async function renderRadio(container) {
  console.log('[Radio] renderRadio start')

  container.innerHTML = `
    <section>
      <h2>Rádio</h2>
      <p>Selecione uma estação para tocar:</p>
      <div id="radio-list">Carregando estações...</div>
      <div id="radio-player" class="radio-player"></div>
    </section>
  `
  const listEl   = container.querySelector('#radio-list')
  const playerEl = container.querySelector('#radio-player')
  let currentAudio

  try {
    const res = await fetch('/data/radio-stations.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(res.statusText)
    const stations = await res.json()
    console.log(`[Radio] fetched ${stations.length} stations`)

    listEl.innerHTML = stations
      .map(st => `<button class="radio-station-btn" data-url="${st.streamUrl}">${st.name}</button>`)
      .join('')
    showToast('Estações de rádio carregadas!', 'success')
  } catch (err) {
    console.error('[Radio] fetch failed:', err)
    listEl.textContent = 'Falha ao carregar estações.'
    showToast(`Erro Rádio: ${err.message}`, 'error')
    return
  }

  const onStationClick = e => {
    const btn = e.target.closest('.radio-station-btn')
    if (!btn) return

    const url  = btn.dataset.url
    const name = btn.textContent

    listEl.querySelectorAll('.radio-station-btn.active')
      .forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    if (currentAudio) currentAudio.pause()

    playerEl.innerHTML = `
      <audio controls autoplay style="width:100%">
        <source src="${url}" type="audio/mpeg" />
        Seu navegador não suporta áudio HTML5.
      </audio>
    `
    currentAudio = playerEl.querySelector('audio')
    currentAudio.addEventListener('error', () => {
      console.error('[Radio] audio error')
      showToast('Erro ao reproduzir áudio', 'error')
    })

    showToast(`Tocando: ${name}`, 'success')
  }

  listEl.addEventListener('click', onStationClick)

  console.log('[Radio] renderRadio end')

  return () => {
    listEl.removeEventListener('click', onStationClick)
    if (currentAudio) currentAudio.pause()
  }
}
