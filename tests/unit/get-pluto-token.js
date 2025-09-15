import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'node:timers/promises';

(async () => {
  console.log('[Pluto Token] A iniciar browser headless...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Intercepta todas as respostas JSON e procura por sessionToken
  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (url.includes('pluto.tv')) {
        const data = await response.json().catch(() => null);
        if (data && typeof data === 'object') {
          const token = data.sessionToken || data.token || null;
          if (token) {
            console.log('[Pluto Token] Token encontrado via interceptação:', token);
            await browser.close();
            process.exit(0);
          }
        }
      }
    } catch {}
  });

  console.log('[Pluto Token] A abrir vídeo de teste...');
  // URL de um VOD público no Pluto (podes trocar por outro)
  await page.goto('https://pluto.tv/on-demand/movies/angel-one-2019-1-1', { waitUntil: 'networkidle2' });

  // Espera para o player carregar e pedir o token
  await sleep(15000);

  // Tenta ler do sessionStorage
  const tokenFromSession = await page.evaluate(() => {
    let found = null;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      if (value && value.includes('sessionToken')) {
        try {
          const parsed = JSON.parse(value);
          if (parsed.sessionToken) {
            found = parsed.sessionToken;
            break;
          }
        } catch {}
      }
    }
    return found;
  });

  if (tokenFromSession) {
    console.log('[Pluto Token] Token encontrado no sessionStorage:', tokenFromSession);
  } else {
    console.log('[Pluto Token] Não foi possível encontrar token no sessionStorage.');
  }

  await browser.close();
})();
