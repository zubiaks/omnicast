// tests/iptv.spec.js
import { test, expect } from '@playwright/test';

test.describe('Página IPTV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'IPTV' }).click();
    await expect(
      page.getByRole('heading', { name: 'IPTV', level: 2 })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('exibe instruções e o botão de demo', async ({ page }) => {
    await expect(
      page.getByText('Selecione um canal para iniciar a transmissão:')
    ).toBeVisible();
    const demoBtn = page.getByRole('button', { name: 'Demo HLS Channel' });
    await expect(demoBtn).toBeVisible();
    await expect(demoBtn).toBeEnabled();
  });

  test('reproduz o canal de demo HLS', async ({ page, browserName }) => {
    // pula o teste no WebKit headless Linux, onde HLS/MSE não carrega
    test.skip(browserName === 'webkit', 'WebKit headless não suporta HLS via MSE');

    // em Chromium/Firefox continuamos a validar
    await page.getByRole('button', { name: 'Demo HLS Channel' }).click();

    const video = page.locator('video#iptv-video');
    await expect(video).toBeVisible({ timeout: 20_000 });

    // só checa se o src foi atribuído (blob: ou .m3u8)
    await page.waitForFunction(() => {
      const v = document.querySelector('video#iptv-video');
      return v?.src?.length > 0;
    }, { timeout: 20_000 });

    const src = await video.getAttribute('src');
    expect(src).toBeTruthy();
  });
});
