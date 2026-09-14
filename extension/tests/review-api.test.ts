import { describe, expect, it, vi } from 'vitest';

import { structureReview } from '../src/api/review-api.js';
import type { ReviewDraft } from '../src/shared/review-draft.js';

const draft: ReviewDraft = {
  id: 'draft-1',
  source: {
    url: 'https://example.test/nova',
    domain: 'example.test',
    pageTitle: 'Nova',
    capturedAt: '2026-09-08T18:00:00.000Z',
  },
  product: { name: 'Nova' },
  research: { notes: '', pros: [], cons: [], testCriteria: ['Verifier autonomie'], tags: [] },
  updatedAt: '2026-09-08T18:00:00.000Z',
};

describe('structureReview', () => {
  it('envoie uniquement les champs de la fiche et valide la reponse', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          summary: 'Produit : Nova.',
          checklist: ['Verifier autonomie'],
          mode: 'demo',
          generatedAt: '2026-09-08T18:30:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const result = await structureReview(draft, fetchMock);
    expect(result.mode).toBe('demo');
    expect(fetchMock).toHaveBeenCalledOnce();
    const options = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(options?.body))).toEqual({
      source: draft.source,
      product: draft.product,
      research: draft.research,
    });
  });

  it('signale une panne API sans modifier la fiche transmise', async () => {
    const original = structuredClone(draft);
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error('Network error'));
    await expect(structureReview(draft, fetchMock)).rejects.toThrow('Network error');
    expect(draft).toEqual(original);
  });

  it('rejette une reponse API incomplete', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ mode: 'demo' }), { status: 200 }));
    await expect(structureReview(draft, fetchMock)).rejects.toThrow('invalide');
  });
});
