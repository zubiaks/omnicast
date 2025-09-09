export async function validarStream(item, timeoutMs = 5000) {
  const url = item.stream_url;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ...item, online: false, motivo: `HTTP ${res.status}` };
    }

    if (url.endsWith('.m3u8')) {
      // Ler apenas os primeiros bytes para validar formato
      const reader = res.body.getReader();
      const { value } = await reader.read();
      const chunk = new TextDecoder().decode(value || '');
      if (!chunk.includes('#EXTM3U')) {
        return { ...item, online: false, motivo: 'Formato inválido' };
      }
    }

    return { ...item, online: true };
  } catch (err) {
    clearTimeout(timeout);
    let motivo = 'Erro desconhecido';
    if (err.name === 'AbortError') motivo = 'Timeout';
    else if (err.message.includes('Failed to fetch')) motivo = 'Bloqueado por CORS';
    return { ...item, online: false, motivo };
  }
}

export async function carregarLista(tipo, basePath = '../assets/data/') {
  let data;
  try {
    const res = await fetch(`${basePath}master_list.json?_=${Date.now()}`);
    data = await res.json();
  } catch {
    console.warn(`Falha ao carregar lista principal (${tipo}), a usar backup.`);
    try {
      const res = await fetch(`${basePath}${tipo}_backup.json`);
      data = await res.json();
    } catch (err) {
      console.error(`Falha ao carregar backup de ${tipo}:`, err);
      return [];
    }
  }

  const items = data.filter(x => x.type === tipo && x.stream_url);
  if (!items.length) {
    console.warn(`Nenhum item encontrado para tipo "${tipo}".`);
    return [];
  }

  // Validação não bloqueante
  const resultados = await Promise.allSettled(items.map(it => validarStream(it)));

  const offline = [];
  const online = [];

  resultados.forEach(r => {
    if (r.status === 'fulfilled' && r.value.online) {
      online.push(r.value);
    } else if (r.status === 'fulfilled') {
      offline.push(r.value);
    }
  });

  console.group(`${tipo} offline (${offline.length})`);
  offline.forEach(c => console.warn(`${c.name}: ${c.motivo}`));
  console.groupEnd();

  localStorage.setItem(`${tipo}_offline`, JSON.stringify(offline.map(x => x.id)));

  return online;
}
