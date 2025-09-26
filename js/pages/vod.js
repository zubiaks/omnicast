import { showToast } from '@/utils/toast.js'

export async function renderVod(container) {
  console.log('[VOD] renderVod start')

  container.innerHTML = `
    <section>
      <h2>VOD</h2>
      <p>Selecione um vídeo para reprodução:</p>
      <div id="vod-grid" class="vod-grid">Carregando vídeos...</div>
      <div id="vod-player" class="vod-player"></div>
    </section>
  `
  const gridEl = container.querySelector('#vod-grid')
  const playerEl = container.querySelector('#vod-player')

  try {
    const res = await fetch('/data/vod-videos.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(res.statusText)
    const videos = await res.json()
    console.log(`[VOD] fetched ${videos.length} items`)

    gridEl.innerHTML = videos
      .map(v => `
        <button class="vod-item" data-url="${v.url}" data-poster="${v.thumbnail}">
          <img src="${v.thumbnail}" alt="${v.title}" />
          <span>${v.title}</span>
        </button>
      `).join('')
    showToast('Lista de vídeos carregada!', 'success')
  } catch (err) {
    console.error('[VOD] fetch failed:', err)
    gridEl.textContent = 'Falha ao carregar vídeos.'
    showToast(`Erro VOD: ${err.message}`, 'error')
    return
  }

  gridEl.addEventListener('click', e => {
    const btn = e.target.closest('.vod-item')
    if (!btn) return

    const url = btn.dataset.url
    const poster = btn.dataset.poster
    const title = btn.querySelector('span').textContent

    gridEl.querySelectorAll('.vod-item.active')
      .forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    playerEl.innerHTML = `
      <video controls autoplay width="100%" poster="${poster}">
        <source src="${url}" type="video/mp4" />
        Seu navegador não suporta vídeo HTML5.
      </video>
    `
    const video = playerEl.querySelector('video')
    video.addEventListener('error', () => {
      console.error('[VOD] video error')
      showToast('Erro ao reproduzir vídeo', 'error')
    })

    showToast(`Reproduzindo: ${title}`, 'success')
  })

  console.log('[VOD] renderVod end')
}
