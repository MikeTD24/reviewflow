import { describe, expect, it } from 'vitest';

import { structureReviewDemo } from '../src/services/demo-structure.js';
import type { StructureReviewRequest } from '../src/validation/review-schema.js';

const fixedDate = new Date('2026-09-08T18:00:00.000Z');

const completeReview: StructureReviewRequest = {
  source: {
    url: 'https://example.test/nova',
    domain: 'example.test',
    pageTitle: 'Nova One',
    capturedAt: '2026-09-08T16:00:00.000Z',
  },
  product: {
    name: 'Nova One',
    category: 'Aspirateur',
    price: 249.9,
    currency: 'EUR',
    description: 'Modele compact.',
  },
  research: {
    notes: 'Donnees a confirmer en test.',
    pros: ['Silencieux'],
    cons: ['Petit reservoir'],
    testCriteria: ['Verifier autonomie', 'Verifier autonomie'],
    tags: ['maison'],
  },
};

describe('structureReviewDemo', () => {
  it('produit un resultat stable a entree et date identiques', () => {
    const first = structureReviewDemo(completeReview, () => fixedDate);
    const second = structureReviewDemo(completeReview, () => fixedDate);
    expect(first).toEqual(second);
    expect(first).toEqual({
      summary:
        'Produit : Nova One. Categorie : Aspirateur. Prix renseigne : 249.9 EUR. Description fournie : Modele compact. Notes editoriales : Donnees a confirmer en test. Points positifs declares : Silencieux. Points negatifs declares : Petit reservoir.',
      checklist: ['Verifier autonomie'],
      mode: 'demo',
      generatedAt: '2026-09-08T18:00:00.000Z',
    });
  });

  it('ne complete pas les informations absentes', () => {
    const sparse: StructureReviewRequest = {
      source: completeReview.source,
      product: { name: 'Produit minimal' },
      research: { notes: '', pros: [], cons: [], testCriteria: [], tags: [] },
    };
    const result = structureReviewDemo(sparse, () => fixedDate);
    expect(result.summary).toBe('Produit : Produit minimal.');
    expect(result.checklist).toEqual([]);
    expect(result.summary).not.toMatch(/prix|categorie|autonomie/i);
  });
});
