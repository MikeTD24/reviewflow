import { rm } from 'node:fs/promises';
import { URL } from 'node:url';

// Un build propre evite de conserver dans dist des fichiers supprimes ou renommes.
await rm(new URL('../dist', import.meta.url), { recursive: true, force: true });
