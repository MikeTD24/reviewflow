import { app } from './app.js';

const port = Number(process.env['PORT'] ?? 3000);

app.listen(port, () => {
  console.log("ReviewFlow API à l'écoute sur le port " + port);
});
