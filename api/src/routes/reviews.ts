import { Router } from 'express';
import { structureReviewDemo } from '../services/demo-structure.js';
import { structureReviewSchema } from '../validation/review-schema.js';

export const reviewsRouter = Router();

reviewsRouter.post('/structure', (request, response) => {
  // safeParse transforme une entree externe en donnees metier fiables sans lancer d exception.
  const parsed = structureReviewSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'Les donnees de la fiche sont invalides.' },
    });
    return;
  }
  response.status(200).json(structureReviewDemo(parsed.data));
});
