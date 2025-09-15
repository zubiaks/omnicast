import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function getPlutoToken() {
  console.log('[Pluto Token] A obter token...');

  // Gera um UUID único para simular um deviceId real
  const deviceId = randomUUID();

  // URL com todos os parâmetros que o site oficial envia
  const url = `https://boot.pluto.tv/v4/start?` +
    `appName=web&appVersion=9.99.9&deviceVersion=1.0` +
    `&deviceModel=Chrome&deviceMake=Chrome&deviceType=web` +
    `&deviceId=${deviceId}&country=PT`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://pluto.tv',
      'Referer': 'https://pluto.tv/'
    }
  });

  if (!res.ok) throw new Error(`Falha ao obter token: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const token = data.sessionToken || data.token || null;

  if (!token) throw new Error('Token não encontrado na resposta do Pluto');

  console.log('[Pluto Token] Token obtido com sucesso:', token);
  return token;
}

(async () => {
  try {
    const token = await getPlutoToken();

    // Testa o token na API real de categorias VOD
    const res = await fetch('https://service-vod.clusters.pluto.tv/v4/vod/categories', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://pluto.tv',
        'Referer': 'https://pluto.tv/',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(`Falha ao obter categorias: ${res.status} ${res.statusText}`);

    const categories = await res.json();
    console.log('Categorias recebidas:', categories.map(c => c.name));

  } catch (err) {
    console.error('Erro:', err.message);
  }
})();
