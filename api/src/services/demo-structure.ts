import type { StructureReviewRequest } from '../validation/review-schema.js';

export type StructuredReview = {
  summary: string;
  checklist: string[];
  mode: 'demo';
  generatedAt: string;
};

export function structureReviewDemo(
  review: StructureReviewRequest,
  now: () => Date = () => new Date(),
): StructuredReview {
  // Le mode demo reformule uniquement les champs presents, sans inventer d information.
  const summaryParts = [`Produit : ${review.product.name}.`];

  if (review.product.category) {
    summaryParts.push(`Categorie : ${review.product.category}.`);
  }
  if (review.product.price !== undefined) {
    const currency = review.product.currency ? ` ${review.product.currency}` : '';
    summaryParts.push(`Prix renseigne : ${review.product.price}${currency}.`);
  }
  if (review.product.description) {
    summaryParts.push(`Description fournie : ${review.product.description}`);
  }
  if (review.research.notes) {
    summaryParts.push(`Notes editoriales : ${review.research.notes}`);
  }
  if (review.research.pros.length > 0) {
    summaryParts.push(`Points positifs declares : ${review.research.pros.join('; ')}.`);
  }
  if (review.research.cons.length > 0) {
    summaryParts.push(`Points negatifs declares : ${review.research.cons.join('; ')}.`);
  }

  return {
    summary: summaryParts.join(' '),
    // Set elimine les criteres dupliques tout en conservant leur ordre de saisie.
    checklist: [...new Set(review.research.testCriteria)],
    mode: 'demo',
    generatedAt: now().toISOString(),
  };
}
