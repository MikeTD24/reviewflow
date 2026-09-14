import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { exit, stderr, stdout } from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const port = 4174;
const distDirectory = fileURLToPath(new URL('../extension/dist/', import.meta.url));
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', `http://127.0.0.1:${port}`).pathname;
  const requestedPath = resolve(
    distDirectory,
    pathname === '/' ? 'popup/popup.html' : pathname.slice(1),
  );
  const relativePath = relative(distDirectory, requestedPath);

  // Ce garde-fou interdit qu'une URL remonte en dehors du dossier compile de l'extension.
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    response.writeHead(404).end();
    return;
  }

  try {
    const file = await stat(requestedPath);
    if (!file.isFile()) throw new Error('Ressource non fichier');
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Ressource introuvable.');
    return;
  }

  const contentType = contentTypes[extname(requestedPath)] ?? 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  createReadStream(requestedPath).pipe(response);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    stderr.write(`Le port ${port} est deja utilise par un autre processus.\n`);
  } else {
    stderr.write(`Impossible de servir l'extension compilee : ${error.message}\n`);
  }
  exit(1);
});

server.listen(port, '127.0.0.1', () => {
  stdout.write(`Popup ReviewFlow disponible pour les tests sur http://127.0.0.1:${port}\n`);
});
