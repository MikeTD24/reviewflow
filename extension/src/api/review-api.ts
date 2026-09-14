import type { ReviewDraft } from '../shared/review-draft.js';

export type GeneratedReview = {
  summary: string;
  checklist: string[];
  mode: 'ai' | 'demo';
  generatedAt: string;
};

const API_URLS = ['http://localhost:3000', 'https://reviewflow-api-miketd24.onrender.com'] as const;

function isGeneratedReview(value: unknown): value is GeneratedReview {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Partial<GeneratedReview>;
  return (
    typeof result.summary === 'string' &&
    Array.isArray(result.checklist) &&
    result.checklist.every((item) => typeof item === 'string') &&
    (result.mode === 'ai' || result.mode === 'demo') &&
    typeof result.generatedAt === 'string'
  );
}

export async function structureReview(
  draft: ReviewDraft,
  fetchImplementation: typeof fetch = fetch,
  apiUrls: readonly string[] = API_URLS,
): Promise<GeneratedReview> {
  let lastNetworkError: unknown;

  for (const apiUrl of apiUrls) {
    try {
      const response = await fetchImplementation(`${apiUrl}/api/reviews/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: draft.source,
          product: draft.product,
          research: draft.research,
        }),
      });

      if (!response.ok) {
        throw new Error(`API ReviewFlow indisponible (${response.status}).`);
      }

      // Une reponse HTTP 200 reste une donnee externe : sa forme est verifiee avant utilisation.
      const result: unknown = await response.json();
      if (!isGeneratedReview(result)) {
        throw new Error("La reponse de l'API ReviewFlow est invalide.");
      }
      return result;
    } catch (error) {
      // Seule une panne reseau justifie le repli : une reponse HTTP invalide doit rester visible.
      if (error instanceof TypeError) {
        lastNetworkError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastNetworkError ?? new Error("L'API ReviewFlow est indisponible.");
}
