import { describe, expect, it } from 'vitest';

import { validateReviewForm, type ReviewFormInput } from '../src/shared/review-form.js';

function validInput(overrides: Partial<ReviewFormInput> = {}): ReviewFormInput {
  return {
    name: 'Nova One',
    description: '',
    category: '',
    price: '',
    currency: '',
    notes: '',
    pros: '',
    cons: '',
    testCriteria: '',
    tags: '',
    ...overrides,
  };
}

describe('validateReviewForm', () => {
  it('normalise les champs et les listes', () => {
    const result = validateReviewForm(
      validInput({
        price: '249,90',
        currency: 'eur',
        pros: 'Silencieux\n\n Compact ',
        cons: 'Petit reservoir',
        testCriteria: 'Verifier autonomie\nVerifier filtration',
        tags: 'maison\naspirateur',
      }),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.product.price).toBe(249.9);
    expect(result.value.product.currency).toBe('EUR');
    expect(result.value.research.pros).toEqual(['Silencieux', 'Compact']);
    expect(result.value.research.testCriteria).toHaveLength(2);
  });

  it('refuse un nom vide, un prix negatif et une devise invalide', () => {
    const result = validateReviewForm(validInput({ name: ' ', price: '-1', currency: 'euro' }));

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors).toEqual({
      name: 'Le nom du produit est obligatoire.',
      price: 'Saisissez un prix positif ou laissez ce champ vide.',
      currency: 'Utilisez un code devise de trois lettres, par exemple EUR.',
    });
  });
});
