import { describe, expect, it } from 'vitest';

import type { ReviewDraft } from '../src/shared/review-draft.js';
import {
  MAX_LOCAL_DRAFTS,
  ReviewStorage,
  type StorageArea,
} from '../src/storage/review-storage.js';

class MemoryStorage implements StorageArea {
  data: Record<string, unknown> = {};
  async get(): Promise<Record<string, unknown>> {
    return structuredClone(this.data);
  }
  async set(items: Record<string, unknown>): Promise<void> {
    Object.assign(this.data, structuredClone(items));
  }
}

function draft(id: string, updatedAt = '2026-09-04T20:00:00.000Z'): ReviewDraft {
  return {
    id,
    source: {
      url: `https://example.test/${id}`,
      domain: 'example.test',
      pageTitle: id,
      capturedAt: '2026-09-04T19:00:00.000Z',
    },
    product: { name: id },
    research: { notes: '', pros: [], cons: [], testCriteria: [], tags: [] },
    updatedAt,
  };
}

describe('ReviewStorage', () => {
  it('sauvegarde puis relit une fiche', async () => {
    const storage = new ReviewStorage(new MemoryStorage());
    await storage.save(draft('draft-1'));
    expect(await storage.get('draft-1')).toEqual(draft('draft-1'));
  });

  it('met a jour une fiche existante sans la dupliquer', async () => {
    const storage = new ReviewStorage(new MemoryStorage());
    await storage.save(draft('draft-1'));
    await storage.save({ ...draft('draft-1'), product: { name: 'Nom corrige' } });
    expect(await storage.list()).toHaveLength(1);
    expect((await storage.get('draft-1'))?.product.name).toBe('Nom corrige');
  });

  it('supprime une fiche', async () => {
    const storage = new ReviewStorage(new MemoryStorage());
    await storage.save(draft('draft-1'));
    await storage.delete('draft-1');
    expect(await storage.list()).toEqual([]);
  });

  it('conserve au maximum les fiches les plus recentes', async () => {
    const storage = new ReviewStorage(new MemoryStorage());
    for (let index = 0; index <= MAX_LOCAL_DRAFTS; index += 1) {
      await storage.save(draft(`draft-${index}`, new Date(index * 1000).toISOString()));
    }
    const drafts = await storage.list();
    expect(drafts).toHaveLength(MAX_LOCAL_DRAFTS);
    expect(drafts[0]?.id).toBe(`draft-${MAX_LOCAL_DRAFTS}`);
    expect(drafts.some(({ id }) => id === 'draft-0')).toBe(false);
  });
});
