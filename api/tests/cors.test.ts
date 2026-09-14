import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../src/app.js';

describe('CORS de developpement', () => {
  it('autorise une origine extension Chrome valide', async () => {
    const origin = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
    const response = await request(app).options('/api/reviews/structure').set('Origin', origin);
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });

  it('ne renvoie pas d autorisation pour une origine externe', async () => {
    const response = await request(app)
      .options('/api/reviews/structure')
      .set('Origin', 'https://attacker.example');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
