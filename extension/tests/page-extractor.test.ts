import { describe, expect, it } from 'vitest';

import {
  createPageCapture,
  normalizePrice,
  type PageSnapshot,
} from '../src/extraction/page-extractor.js';

function snapshot(jsonLd: string[], overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    title: 'Titre de repli',
    url: 'https://shop.example.test/products/nova',
    description: 'Description issue des metadonnees',
    openGraphTitle: 'Nom Open Graph',
    selectedText: '',
    jsonLd,
    ...overrides,
  };
}

describe('createPageCapture', () => {
  it('extrait un produit depuis un objet JSON-LD valide', () => {
    const capture = createPageCapture(
      snapshot([
        JSON.stringify({
          '@type': 'Product',
          name: 'Nova One',
          description: 'Aspirateur fictif',
          offers: { price: '249,90', priceCurrency: 'EUR' },
        }),
      ]),
    );

    expect(capture.product).toEqual({
      name: 'Nova One',
      description: 'Aspirateur fictif',
      price: 249.9,
      currency: 'EUR',
    });
  });

  it('trouve un produit dans un tableau', () => {
    const capture = createPageCapture(
      snapshot([
        JSON.stringify([{ '@type': 'BreadcrumbList' }, { '@type': 'Product', name: 'Nova Array' }]),
      ]),
    );

    expect(capture.product.name).toBe('Nova Array');
  });

  it('trouve un produit dans @graph', () => {
    const capture = createPageCapture(
      snapshot([
        JSON.stringify({
          '@graph': [
            { '@type': 'Organization' },
            { '@type': ['Thing', 'Product'], name: 'Nova Graph' },
          ],
        }),
      ]),
    );

    expect(capture.product.name).toBe('Nova Graph');
  });

  it('ignore un JSON invalide et utilise les metadonnees', () => {
    const capture = createPageCapture(
      snapshot(['{invalid'], { openGraphTitle: '', selectedText: '  Passage choisi  ' }),
    );

    expect(capture.product).toEqual({
      name: 'Titre de repli',
      description: 'Description issue des metadonnees',
    });
    expect(capture.selectedText).toBe('Passage choisi');
  });

  it('omet le prix et la devise lorsqu ils sont absents', () => {
    const capture = createPageCapture(
      snapshot([JSON.stringify({ '@type': 'Product', name: 'Nova sans prix' })]),
    );

    expect(capture.product).toEqual({
      name: 'Nova sans prix',
      description: 'Description issue des metadonnees',
    });
  });
});

describe('normalizePrice', () => {
  it.each([
    ['1 299,99 EUR', 1299.99],
    ['1,299.99', 1299.99],
    [249, 249],
  ])('normalise %s', (value, expected) => {
    expect(normalizePrice(value)).toBe(expected);
  });
});
