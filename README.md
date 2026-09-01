# ReviewFlow

ReviewFlow est une extension Chrome et Edge qui aide les equipes editoriales a capturer, enrichir, structurer et exporter des recherches produit.

Le projet est un portfolio independant. Il n'est ni commande, ni approuve, ni affilie a Whale Media.

## Etat du projet

Le MVP est en cours de developpement. Son perimetre et son backlog sont disponibles dans :

- [`docs/CAHIER_DES_CHARGES.md`](docs/CAHIER_DES_CHARGES.md) ;
- [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Structure

```text
reviewflow/
|-- extension/  # Extension Chrome/Edge Manifest V3
|-- api/        # API Node.js/Express
`-- docs/       # Cahier des charges et backlog
```

## Prerequis

- Node.js 20 ou superieur ;
- npm 10 ou superieur ;
- Chrome ou Edge pour tester l'extension.

## Commandes

```bash
npm install
npm run build
npm test
npm run lint
npm run format:check
```
