import { test, expect } from '@playwright/test';

test.describe('Fluxo IPTV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/iptv');
  });

  test('lista de canais é exibida', async ({ page }) => {
    await expect(page.locator('#iptv-list')).toContainText('Demo HLS Channel');
  });

  test('reproduz canal com blob src', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'HLS.js não funciona no WebKit headless');

    await page.click('.iptv-channel-btn');
    const video = page.locator('#iptv-video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('src', /^blob:/);
  });

  test('página offline.html carrega corretamente', async ({ page }) => {
    await page.goto('/offline.html');
    await expect(page.locator('h1')).toHaveText('Você está Offline');
  });
});
