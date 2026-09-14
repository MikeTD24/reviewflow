import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

const validReview = {
  source: {
    url: 'https://example.test/nova',
    domain: 'example.test',
    pageTitle: 'Nova One',
    capturedAt: '2026-09-08T16:00:00.000Z',
  },
  product: { name: 'Nova One', price: 249.9, currency: 'eur' },
  research: {
    notes: 'Produit fictif',
    pros: ['Silencieux'],
    cons: [],
    testCriteria: ['Verifier autonomie'],
    tags: ['maison'],
  },
};

describe('API ReviewFlow', () => {
  it('repond au controle de disponibilite', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
  it('accepte et normalise une fiche valide', async () => {
    const response = await request(app).post('/api/reviews/structure').send(validReview);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ mode: 'demo', checklist: ['Verifier autonomie'] });
    expect(response.body.summary).toContain('Prix renseigne : 249.9 EUR.');
    expect(response.body.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it('rejette une fiche invalide sans exposer les details internes', async () => {
    const response = await request(app)
      .post('/api/reviews/structure')
      .send({
        ...validReview,
        product: { name: '', price: -1 },
      });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: 'INVALID_REQUEST', message: 'Les donnees de la fiche sont invalides.' },
    });
  });
  it('rejette un corps trop volumineux', async () => {
    const response = await request(app)
      .post('/api/reviews/structure')
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          ...validReview,
          research: { ...validReview.research, notes: 'x'.repeat(110_000) },
        }),
      );
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
