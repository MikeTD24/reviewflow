import { describe, expect, it } from 'vitest';
import {
  createReviewExport,
  exportReviewAsCsv,
  exportReviewAsJson,
  exportReviewAsMarkdown,
} from '../src/export/review-export.js';
import type { ReviewDraft } from '../src/shared/review-draft.js';

const draft: ReviewDraft = {
  id: 'draft-1',
  source: {
    url: 'https://example.test/p?id=1&lang=fr',
    domain: 'example.test',
    pageTitle: 'Produit [test]',
    capturedAt: '2026-09-09T08:00:00.000Z',
  },
  product: { name: 'Cafetiere Etoile / Edition #1' },
  research: { notes: '', pros: [], cons: [], testCriteria: [], tags: [] },
  generated: {
    summary: 'Resume *factuel*.',
    checklist: [],
    mode: 'demo',
    generatedAt: '2026-09-09T08:05:00.000Z',
  },
  updatedAt: '2026-09-09T08:05:00.000Z',
};

describe('exports ReviewFlow', () => {
  it('produit un JSON valide sans perdre les champs facultatifs', () => {
    expect(JSON.parse(exportReviewAsJson(draft))).toEqual(draft);
  });
  it('produit un Markdown lisible avec source, dates, mode et listes vides', () => {
    const markdown = exportReviewAsMarkdown(draft);
    expect(markdown).toContain('- Mode : demo');
    expect(markdown).toContain('- URL : <https://example.test/p?id=1&lang=fr>');
    expect(markdown).toContain('Resume \\*factuel\\*.');
    expect(markdown).toContain('_Aucun element._');
  });
  it('produit un CSV UTF-8 dont les cellules speciales restent lisibles dans un tableur', () => {
    const csv = exportReviewAsCsv({
      ...draft,
      product: { ...draft.product, name: 'Cafetiere; "Etoile"' },
      research: { ...draft.research, notes: 'Premiere ligne\nSeconde ligne' },
    });
    expect(csv.startsWith('\uFEFFid;nom;categorie;prix;devise;description_produit;')).toBe(true);
    expect(csv).toContain('"Cafetiere; ""Etoile"""');
    expect(csv).toContain('"Premiere ligne\r\nSeconde ligne"');
  });
  it('cree des noms de fichiers surs', () => {
    expect(createReviewExport(draft, 'markdown').filename).toBe(
      'cafetiere-etoile-edition-1-2026-09-09.md',
    );
    expect(createReviewExport(draft, 'csv')).toMatchObject({
      filename: 'cafetiere-etoile-edition-1-2026-09-09.csv',
      mimeType: 'text/csv',
    });
  });
});
