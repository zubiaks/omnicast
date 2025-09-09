// Futuro: podes importar { validarStream } do validator-core.js para validar streams de rádio
// import { validarStream } from '../validators/validator-core.js';

async function carregarRadios() {
  const tbody = document.querySelector('#radiosTable tbody');
  const lastUpdateEl = document.getElementById('lastUpdate');

  // Feedback inicial
  tbody.innerHTML = `<tr><td colspan="7">A carregar...</td></tr>`;

  try {
    let data;
    try {
      const res = await fetch('../assets/data/status.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao obter status.json');
      data = await res.json();
    } catch {
      console.warn('Falha ao carregar status.json, a usar backup.');
      try {
        const res = await fetch('../assets/data/status_backup.json', { cache: 'no-store' });
        data = await res.json();
      } catch (err) {
        console.error('Falha ao carregar backup de rádios:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="offline">Erro ao carregar dados</td></tr>`;
        lastUpdateEl.textContent = '-';
        return;
      }
    }

    const radios = Array.isArray(data.radios) ? data.radios : [];

    if (!radios.length) {
      tbody.innerHTML = `<tr><td colspan="7">Nenhuma rádio disponível</td></tr>`;
      lastUpdateEl.textContent = '-';
      return;
    }

    tbody.innerHTML = '';
    const offline = [];

    radios.forEach(radio => {
      if (radio.Estado !== 'online') offline.push(radio);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${radio.Nome || ''}</td>
        <td class="${radio.Estado === 'online' ? 'online' : 'offline'}">${radio.Estado}</td>
        <td>${radio.Pontuação ?? ''}</td>
        <td>${radio["Tempo de Resposta"] ?? ''}</td>
        <td>${radio.Bitrate ?? ''}</td>
        <td>${radio.Género ?? ''}</td>
        <td>${radio["Música Atual"] ?? ''}</td>
      `;
      tbody.appendChild(tr);
    });

    if (offline.length) {
      console.group(`Rádios offline (${offline.length})`);
      offline.forEach(r => console.warn(`${r.Nome || 'Sem nome'}: ${r.Estado}`));
      console.groupEnd();
    }

    lastUpdateEl.textContent = data.generated_at
      ? new Date(data.generated_at).toLocaleTimeString()
      : '-';
  } catch (err) {
    console.error('Erro ao carregar rádios:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="offline">Erro ao carregar dados</td></tr>`;
    lastUpdateEl.textContent = '-';
  }
}

// Carregar de imediato e atualizar a cada 30s
carregarRadios();
setInterval(carregarRadios, 30000);
