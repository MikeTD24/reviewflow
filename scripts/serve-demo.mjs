import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { exit, stderr, stdout } from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const port = 4173;
const productPage = fileURLToPath(new URL('../demo/product.html', import.meta.url));

// Servir la page en HTTP evite l'autorisation speciale necessaire aux URL file://.
const server = createServer((request, response) => {
  if (request.url !== '/' && request.url !== '/product.html') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Page introuvable.');
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  createReadStream(productPage).pipe(response);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    stderr.write(
      `Le port ${port} est deja utilise. Ouvrez http://localhost:${port} ou identifiez son PID avec : netstat -ano | findstr :${port}\n`,
    );
  } else {
    stderr.write(`Impossible de lancer la page de demonstration : ${error.message}\n`);
  }
  exit(1);
});

server.listen(port, '127.0.0.1', () => {
  stdout.write(`Page produit ReviewFlow disponible sur http://localhost:${port}\n`);
});
