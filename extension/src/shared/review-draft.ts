import type { EditableReview } from './review-form.js';

export type ReviewDraft = EditableReview & {
  id: string;
  source: {
    url: string;
    domain: string;
    pageTitle: string;
    description?: string;
    selectedText?: string;
    capturedAt: string;
  };
  // Une fiche reste exploitable localement meme si elle n'a jamais ete structuree par l'API.
  generated?: {
    summary: string;
    checklist: string[];
    mode: 'ai' | 'demo';
    generatedAt: string;
  };
  updatedAt: string;
};
