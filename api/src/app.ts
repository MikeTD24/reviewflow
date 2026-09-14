import express, { type ErrorRequestHandler } from 'express';
import { reviewsRouter } from './routes/reviews.js';

export const app = express();
app.disable('x-powered-by');
app.use((request, response, next) => {
  const origin = request.headers.origin;
  // Edge utilise lui aussi chrome-extension:// ; l identifiant Chromium contient 32 lettres a-p.
  const allowed =
    origin &&
    (/^chrome-extension:\/\/[a-p]{32}$/.test(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  if (allowed) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});
app.use('/api/reviews', reviewsRouter);
app.use((_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ressource introuvable.' } });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    response.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Le contenu envoye est trop volumineux.' },
    });
    return;
  }
  // Le detail est journalise cote serveur, jamais renvoye au client.
  console.error('Erreur API ReviewFlow', error);
  response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
  });
};
app.use(errorHandler);
