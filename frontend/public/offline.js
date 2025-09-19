// frontend/public/js/offline.js
document.addEventListener('DOMContentLoaded', () => {
  const retryBtn = document.getElementById('retry-btn');
  const messageEl = document.querySelector('.offline-message');

  function updateMessage(text) {
    messageEl.textContent = text;
  }

  function tryReconnect() {
    retryBtn.disabled = true;
    retryBtn.textContent = 'Conectando…';

    fetch('/healthz', { cache: 'no-store' })
      .then(response => {
        if (response.ok) {
          updateMessage('Conexão restabelecida. Recarregando…');
          setTimeout(() => window.location.reload(), 800);
        } else {
          throw new Error('Sem resposta');
        }
      })
      .catch(() => {
        updateMessage('Ainda sem conexão. Tente novamente.');
        retryBtn.disabled = false;
        retryBtn.textContent = 'Tentar novamente';
      });
  }

  retryBtn.addEventListener('click', tryReconnect);

  window.addEventListener('online', () => {
    updateMessage('Conexão detectada. Recarregando…');
    setTimeout(() => window.location.reload(), 800);
  });

  window.addEventListener('offline', () => {
    updateMessage('Você está offline.');
  });
});
