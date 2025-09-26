// js/pages/home.js

export function renderHome(container) {
  console.log('[Home] renderHome start')
  container.innerHTML = `
    <section class="hero">
      <h2>Bem-vindo ao OmniCast</h2>
      <p>Escolha uma categoria no menu acima para começar.</p>
    </section>
  `
  console.log('[Home] renderHome end')
}
