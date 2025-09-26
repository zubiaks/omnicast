// js/pages/not-found.js

export function renderNotFound(container) {
  console.log('[NotFound] renderNotFound start')
  container.innerHTML = `
    <section>
      <h2>404</h2>
      <p>Seção não encontrada.</p>
    </section>
  `
  console.log('[NotFound] renderNotFound end')
}
