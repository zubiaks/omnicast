// tests/accessibility.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const paths = ['/', '/iptv', '/vod', '/radio', '/webcams', '/404'];

test.describe('Acessibilidade WCAG2A/AA em todas as páginas', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/public/data/iptv-channels.json', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'demo', name: 'Canal Demo', url: 'https://demo.stream/hls.m3u8' }
        ]),
      })
    );
  });

  for (const path of paths) {
    test(`rota "${path}" sem violações`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toHaveLength(0);
    });
  }
});
