import { expect, test, type Download, type Page } from '@playwright/test';

type PageSnapshot = {
  title: string;
  url: string;
  description: string;
  openGraphTitle: string;
  selectedText: string;
  jsonLd: string[];
};

async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function installChromeAdapter(page: Page, snapshot: PageSnapshot): Promise<void> {
  await page.addInitScript((capturedPage) => {
    const storage: Record<string, unknown> = {};

    // Le navigateur de test fournit les trois API Chrome utilisees par le popup en production.
    Reflect.set(globalThis, 'chrome', {
      tabs: { query: async () => [{ id: 1 }] },
      scripting: { executeScript: async () => [{ result: capturedPage }] },
      storage: {
        local: {
          get: async (key: string | string[] | null) =>
            typeof key === 'string' ? { [key]: storage[key] } : { ...storage },
          set: async (items: Record<string, unknown>) => Object.assign(storage, items),
        },
      },
    });
  }, snapshot);
}

test('capture, corrige, structure, exporte et supprime une fiche', async ({ context, page }) => {
  await page.goto('http://127.0.0.1:4173');
  await expect(page.getByRole('heading', { name: 'AeroClean Nova X1' })).toBeVisible();

  await page.locator('.selection').evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  });

  const snapshot = await page.evaluate<PageSnapshot>(() => ({
    title: document.title,
    url: window.location.href,
    description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? '',
    openGraphTitle:
      document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '',
    selectedText: window.getSelection()?.toString() ?? '',
    jsonLd: Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
    ).map((script) => script.textContent ?? ''),
  }));

  const popup = await context.newPage();
  await installChromeAdapter(popup, snapshot);
  await popup.goto('http://127.0.0.1:4174/popup/popup.html');

  await popup.getByRole('button', { name: 'Capturer cette page' }).click();
  await expect(popup.getByRole('status')).toHaveText('Page capturee avec succes.');
  await expect(popup.locator('#product-name')).toHaveValue('AeroClean Nova X1');
  await expect(popup.locator('#product-price')).toHaveValue('149.9');
  await expect(popup.locator('#product-currency')).toHaveValue('EUR');
  await expect(popup.locator('#selected-text')).toContainText('mode silencieux');

  await popup.locator('#product-name').fill('');
  await popup.getByRole('button', { name: 'Sauvegarder la fiche' }).click();
  await expect(popup.locator('#product-name-error')).toHaveText(
    'Le nom du produit est obligatoire.',
  );

  await popup.locator('#product-name').fill('AeroClean Nova X1');
  await popup.locator('#product-category').fill('Maison et entretien');
  await popup.locator('#research-notes').fill('Comparer avec les modèles concurrents.');
  await popup.locator('#research-pros').fill('Compact\nPrix lisible');
  await popup.locator('#research-cons').fill('Autonomie à confirmer');
  await popup.locator('#research-criteria').fill('Tester autonomie\nTester autonomie');
  await popup.locator('#research-tags').fill('aspirateur\nmaison');
  await popup.getByRole('button', { name: 'Sauvegarder la fiche' }).click();

  await expect(popup.getByRole('status')).toHaveText('Fiche sauvegardee localement.');
  await expect(popup.locator('#draft-count')).toHaveText('1');
  await expect(popup.getByRole('button', { name: 'Structurer la fiche' })).toBeEnabled();

  await popup.getByRole('button', { name: 'Structurer la fiche' }).click();
  await expect(popup.getByRole('status')).toHaveText('Fiche structuree avec succes en mode demo.');
  await expect(popup.locator('#generation-mode')).toHaveText('demo');
  await expect(popup.locator('#generated-summary')).toContainText('AeroClean Nova X1');
  await expect(popup.locator('#generated-checklist li')).toHaveText(['Tester autonomie']);

  const [jsonDownload] = await Promise.all([
    popup.waitForEvent('download'),
    popup.getByRole('button', { name: 'Exporter JSON' }).click(),
  ]);
  expect(jsonDownload.suggestedFilename()).toMatch(/^aeroclean-nova-x1-\d{4}-\d{2}-\d{2}\.json$/);
  const json = JSON.parse(await readDownload(jsonDownload));
  expect(json.product).toMatchObject({ name: 'AeroClean Nova X1', price: 149.9, currency: 'EUR' });
  expect(json.generated).toMatchObject({ mode: 'demo', checklist: ['Tester autonomie'] });

  const [markdownDownload] = await Promise.all([
    popup.waitForEvent('download'),
    popup.getByRole('button', { name: 'Exporter Markdown' }).click(),
  ]);
  expect(await readDownload(markdownDownload)).toContain('# AeroClean Nova X1');

  const [csvDownload] = await Promise.all([
    popup.waitForEvent('download'),
    popup.getByRole('button', { name: 'Exporter CSV' }).click(),
  ]);
  expect(csvDownload.suggestedFilename()).toMatch(/^aeroclean-nova-x1-\d{4}-\d{2}-\d{2}\.csv$/);
  const csv = await readDownload(csvDownload);
  expect(csv.startsWith('\uFEFFid;nom;categorie;prix;devise;')).toBe(true);
  expect(csv).toContain('AeroClean Nova X1');

  popup.once('dialog', (dialog) => dialog.accept());
  await popup.getByRole('button', { name: 'Supprimer AeroClean Nova X1' }).click();
  await expect(popup.locator('#draft-count')).toBeEmpty();
  await expect(popup.locator('#no-drafts')).toHaveText('Aucune fiche sauvegardee.');
  await expect(popup.getByRole('status')).toHaveText('Fiche supprimee.');
});
