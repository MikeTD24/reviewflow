import type { ReviewDraft } from '../shared/review-draft.js';

export const MAX_LOCAL_DRAFTS = 50;
const STORAGE_KEY = 'reviewflow:drafts';

export type StorageArea = {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

function isReviewDraft(value: unknown): value is ReviewDraft {
  // chrome.storage contient des donnees non typees : ce garde ignore une entree corrompue.
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ReviewDraft>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.source?.url === 'string' &&
    typeof candidate.product?.name === 'string'
  );
}

export class ReviewStorage {
  constructor(private readonly storage: StorageArea) {}
  async list(): Promise<ReviewDraft[]> {
    const stored = await this.storage.get(STORAGE_KEY);
    const drafts = stored[STORAGE_KEY];
    if (!Array.isArray(drafts)) return [];
    return drafts.filter(isReviewDraft).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async get(id: string): Promise<ReviewDraft | undefined> {
    return (await this.list()).find((draft) => draft.id === id);
  }
  async save(draft: ReviewDraft): Promise<void> {
    const drafts = (await this.list()).filter((stored) => stored.id !== draft.id);
    // La fiche courante remonte en tete et la limite borne l espace local utilise.
    await this.storage.set({ [STORAGE_KEY]: [draft, ...drafts].slice(0, MAX_LOCAL_DRAFTS) });
  }
  async delete(id: string): Promise<void> {
    const drafts = (await this.list()).filter((draft) => draft.id !== id);
    await this.storage.set({ [STORAGE_KEY]: drafts });
  }
}
