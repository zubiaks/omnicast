import { test, expect } from '@playwright/test';

test.describe('Página IPTV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/iptv');
  });

  test('deve listar canais disponíveis', async ({ page }) => {
    await expect(page.locator('ul.channel-list')).toBeVisible();
    const items = await page.locator('ul.channel-list > li').count();
    expect(items).toBeGreaterThan(0);
  });

  test('reproduz um canal HLS', async ({ page }) => {
    await page.click('ul.channel-list > li:first-child button.play');
    // espera o player carregar
    await expect(page.locator('video')).toHaveAttribute('src', /m3u8$/);
    // opcional: checar se está tocando
    await expect(page.locator('video')).toHaveJSProperty('paused', false);
  });
});
