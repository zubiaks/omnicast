import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const paths = [
  '/',         // home.js
  '/iptv',     // iptv.js
  '/vod',      // vod.js
  '/radio',    // radio.js
  '/webcams',  // webcams.js
  '/404'       // not-found.js — opcional, testa rota inexistente
];

test.describe('Acessibilidade WCAG2A/AA em todas as páginas', () => {
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
