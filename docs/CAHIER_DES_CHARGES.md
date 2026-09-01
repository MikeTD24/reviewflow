# ReviewFlow - Cahier des charges du MVP

Version : 1.1  
Statut : perimetre MVP valide - pret pour le developpement  
Charge cible : 12 a 16 heures

## 1. Vision du produit

ReviewFlow est une extension Chrome et Edge destinee aux redacteurs, testeurs et equipes editoriales qui collectent des informations sur des produits depuis des pages web.

Elle permet de capturer les informations utiles de la page active, de les completer avec des notes humaines, de les structurer avec une petite API assistee par IA et de les exporter dans un format reutilisable.

Le produit est un projet de portfolio independant. Il n'est ni commande, ni approuve, ni affilie a Whale Media.

## 2. Probleme traite

Lors d'une recherche produit, les informations sont dispersees entre les pages marchandes, les notes du testeur et les documents editoriaux. Les copier manuellement est lent et produit des fiches inconsistantes.

ReviewFlow reduit cette friction en proposant un flux unique :

1. ouvrir une fiche produit ;
2. capturer ses metadonnees ;
3. ajouter des observations humaines ;
4. generer une fiche structuree ;
5. exporter le resultat.

## 3. Utilisateur cible

Utilisateur principal : redacteur, testeur produit ou assistant editorial.

Ses besoins principaux sont :

- collecter rapidement des faits provenant d'une page ;
- distinguer les informations sourcees de ses propres observations ;
- conserver ses brouillons localement ;
- obtenir une structure de fiche coherente ;
- recuperer les donnees sans dependance a un outil proprietaire.

## 4. Perimetre fonctionnel du MVP

### 4.1 Capture de la page active

Depuis le popup de l'extension, l'utilisateur peut capturer :

- le titre de la page ;
- l'URL et le nom de domaine ;
- la description de la page lorsqu'elle est disponible ;
- le nom du produit ;
- le prix et la devise lorsqu'ils sont detectables ;
- le texte actuellement selectionne dans la page.

L'extraction utilise, dans cet ordre :

1. les donnees structurees JSON-LD de type `Product` ;
2. les metadonnees Open Graph et les balises usuelles ;
3. le titre du document ;
4. la saisie manuelle de l'utilisateur.

L'utilisateur doit toujours pouvoir corriger les valeurs extraites. ReviewFlow ne pretend pas garantir leur exactitude.

### 4.2 Enrichissement humain

La fiche comprend les champs editables suivants :

- nom du produit ;
- categorie ;
- prix et devise ;
- notes libres ;
- points positifs ;
- points negatifs ;
- criteres a verifier pendant le test ;
- tags.

Les points positifs, negatifs et criteres sont des listes de textes courts.

### 4.3 Sauvegarde locale

L'utilisateur peut :

- sauvegarder une fiche ;
- consulter ses fiches recentes ;
- rouvrir et modifier une fiche ;
- supprimer une fiche apres confirmation.

Les fiches sont conservees avec `chrome.storage.local`. Aucun compte utilisateur ni base de donnees distante n'est requis dans le MVP.

### 4.4 Structuration par l'API

Un bouton `Structurer la fiche` envoie uniquement les champs de la fiche a l'API ReviewFlow.

L'API :

- valide les donnees recues ;
- normalise les listes et les textes ;
- genere un resume factuel ;
- propose une checklist de test ;
- renvoie une fiche structuree ;
- indique si le resultat provient du mode IA ou du mode local de demonstration.

Le fournisseur IA est facultatif et configure exclusivement sur le serveur. Si aucune cle n'est presente ou si le fournisseur est indisponible, une strategie deterministe produit un resultat de demonstration fonctionnel.

L'IA ne doit pas inventer des caracteristiques. Toute information non presente dans l'entree doit etre formulee comme un point a verifier, et non comme un fait.

Les deux modes sont definis ainsi :

- `demo` : actif par defaut, sans cle externe, resultat reproductible construit uniquement a partir des donnees transmises ;
- `ai` : optionnel, configure cote serveur, soumis aux memes regles factuelles et avec retour automatique vers `demo` en cas d'indisponibilite.

Le mode utilise est toujours affiche a l'utilisateur et present dans l'export.

### 4.5 Export

Une fiche sauvegardee peut etre exportee en :

- JSON, pour la reutilisation par une application ;
- Markdown, pour la lecture et le travail editorial.

Le fichier exporte contient la source, la date de capture et le mode de generation utilise.

## 5. Parcours utilisateur principal

1. L'utilisateur ouvre une page produit.
2. Il selectionne eventuellement un passage utile.
3. Il ouvre ReviewFlow et clique sur `Capturer cette page`.
4. Il verifie et corrige les informations detectees.
5. Il ajoute ses notes, points positifs, points negatifs et tags.
6. Il sauvegarde la fiche localement.
7. Il clique sur `Structurer la fiche`.
8. Il relit le resultat et conserve le controle editorial.
9. Il exporte la fiche en Markdown ou JSON.

## 6. Architecture technique

Le projet utilise un monorepo simple :

```text
reviewflow/
|-- extension/
|   |-- src/
|   |   |-- popup/
|   |   |-- dashboard/
|   |   |-- extraction/
|   |   |-- storage/
|   |   `-- shared/
|   |-- manifest.json
|   `-- tests/
|-- api/
|   |-- src/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- validation/
|   |   `-- app.ts
|   `-- tests/
|-- docs/
|-- .env.example
|-- package.json
`-- README.md
```

Stack retenue :

- extension Manifest V3 ;
- TypeScript ;
- HTML et CSS sans framework lourd pour le popup ;
- Node.js et Express pour l'API ;
- validation des entrees avec Zod ;
- Vitest pour les tests ;
- ESLint et Prettier pour la qualite ;
- Docker pour l'API seulement si le MVP principal est termine.

Flux d'architecture :

```text
Page produit
    |
    | lecture explicite de la page active
    v
Extension ReviewFlow
    |-- formulaire editable
    |-- chrome.storage.local
    |-- exports JSON et Markdown
    |
    | POST /api/reviews/structure
    v
API Express
    |-- validation Zod
    |-- mode demo deterministe (par defaut)
    `-- fournisseur LLM optionnel avec fallback
```

Permissions minimales de l'extension :

- `activeTab` ;
- `scripting` ;
- `storage`.

Les permissions d'hote sont limitees a l'URL de l'API configuree. L'extension ne realise ni exploration automatique de sites, ni collecte en arriere-plan.

## 7. Modele de donnees principal

```ts
type ReviewDraft = {
  id: string;
  source: {
    url: string;
    domain: string;
    pageTitle: string;
    description?: string;
    selectedText?: string;
    capturedAt: string;
  };
  product: {
    name: string;
    category?: string;
    price?: number;
    currency?: string;
  };
  research: {
    notes: string;
    pros: string[];
    cons: string[];
    testCriteria: string[];
    tags: string[];
  };
  generated?: {
    summary: string;
    checklist: string[];
    mode: 'ai' | 'demo';
    generatedAt: string;
  };
  updatedAt: string;
};
```

## 8. Contrat minimal de l'API

### Controle de disponibilite

```http
GET /api/health
```

Reponse attendue :

```json
{ "status": "ok" }
```

### Structuration d'une fiche

```http
POST /api/reviews/structure
Content-Type: application/json
```

Le corps contient `source`, `product` et `research`. La reponse contient :

```json
{
  "summary": "Resume base uniquement sur les informations transmises.",
  "checklist": ["Verifier l'autonomie reelle"],
  "mode": "demo",
  "generatedAt": "2026-09-01T10:00:00.000Z"
}
```

Codes principaux :

- `200` : fiche structuree ;
- `400` : donnees invalides ;
- `413` : contenu trop volumineux ;
- `429` : limite d'utilisation atteinte ;
- `500` : erreur interne sans exposition d'information sensible.

## 9. Exigences non fonctionnelles

### Qualite et UX

- popup utilisable a partir de 360 px de largeur ;
- navigation au clavier ;
- labels explicites pour les champs ;
- etats de chargement, succes, absence de donnees et erreur ;
- confirmation avant suppression ;
- interface en francais pour le MVP.

### Securite et confidentialite

- aucune cle d'API dans l'extension ou le depot ;
- fichier `.env.example` sans secret ;
- validation serveur de toutes les donnees ;
- limite de taille des requetes ;
- CORS limite a l'extension et aux environnements de developpement connus ;
- aucun envoi vers l'API sans action explicite de l'utilisateur ;
- aucune execution de HTML provenant d'une page externe.

### Performance

- ouverture du popup sans appel reseau automatique ;
- extraction de la page en moins d'une seconde sur une page normale ;
- conservation d'un maximum documente de fiches locales afin d'eviter de saturer le stockage.

## 10. Tests obligatoires

Le MVP comprend au minimum :

- extraction depuis une page contenant du JSON-LD `Product` ;
- repli vers les metadonnees et le titre de page ;
- normalisation d'un prix ;
- sauvegarde et relecture d'une fiche ;
- rejet d'une requete API invalide ;
- generation deterministe sans fournisseur IA ;
- verification que le resume ne complete pas arbitrairement les donnees manquantes.

Une page HTML de demonstration locale sert de source produit stable pour les tests et la video.

Les tests sont ajoutes avec chaque fonctionnalite critique et non reportes en bloc a la fin du projet. Aucun pourcentage de couverture arbitraire n'est impose : les comportements metier cites ci-dessus doivent etre couverts et lisibles.

## 11. Criteres d'acceptation du MVP

Le MVP est considere termine lorsque :

- l'extension s'installe sans erreur dans Chrome et Edge en mode developpeur ;
- elle capture correctement les informations de la page de demonstration ;
- chaque valeur peut etre corrigee manuellement ;
- une fiche reste disponible apres fermeture et reouverture du navigateur ;
- la modification et la suppression fonctionnent ;
- l'API valide et structure une fiche ;
- le mode de demonstration fonctionne sans cle d'API ;
- aucune cle ou donnee sensible n'est presente dans Git ;
- les exports JSON et Markdown sont valides ;
- les tests obligatoires passent ;
- le lint et le build de production passent sans erreur ;
- le README permet a un tiers d'installer et tester le projet ;
- des captures ou une courte demonstration illustrent le parcours complet.

## 12. Elements explicitement hors perimetre

Afin de tenir le delai, le MVP n'inclut pas :

- authentification ou comptes utilisateurs ;
- paiement Stripe ;
- base de donnees distante ;
- publication sur le Chrome Web Store ;
- collecte automatique de nombreuses pages ;
- comparaison ou recommandation automatique de produits ;
- generation d'un article complet ;
- tableau de bord Angular ;
- historique collaboratif ;
- prise de capture d'ecran ;
- prise en charge multilingue complete.

## 13. Bonus classes par priorite

Seulement apres validation de tous les criteres du MVP :

1. connexion reelle a un fournisseur LLM ;
2. deploiement public de l'API ;
3. Dockerisation de l'API ;
4. export CSV ;
5. webhook vers n8n, Make ou une URL configurable ;
6. tests end-to-end de l'extension ;
7. tableau de bord Angular ;
8. version anglaise.

## 14. Estimation de charge

| Lot                                     | Charge cible |
| --------------------------------------- | -----------: |
| Initialisation, architecture et qualite |       1 h 30 |
| Capture DOM et JSON-LD                  |       2 h 30 |
| Formulaire et stockage local            |          3 h |
| Liste, modification et suppression      |       1 h 30 |
| API, validation et mode demo            |       2 h 30 |
| Exports JSON et Markdown                |          1 h |
| Tests et corrections                    |       1 h 30 |
| README, captures et demonstration       |       1 h 30 |
| Marge de securite                       |          1 h |
| **Total cible**                         |     **16 h** |

La marge sert uniquement a terminer le MVP. Les bonus ne commencent pas tant qu'un critere d'acceptation reste incomplet.

## 15. Livrables de candidature

- depot GitHub public `reviewflow` ;
- code source de l'extension et de l'API ;
- archive installable de l'extension ;
- README avec probleme, solution, architecture et installation ;
- captures d'ecran et GIF ou video courte ;
- exemple d'export Markdown ;
- page de demonstration produit ;
- mention transparente de l'utilisation des assistants IA ;
- lien de demonstration de l'API si elle est deployee.

## 16. Scenario de demonstration

La demonstration, d'une duree cible de 60 a 90 secondes, montre :

1. une page fictive d'aspirateur ;
2. la selection d'un passage ;
3. la capture par ReviewFlow ;
4. l'ajout d'un avantage et d'un critere de test ;
5. la sauvegarde locale ;
6. la structuration par l'API ;
7. l'export en Markdown.

Le scenario utilise des donnees fictives afin d'eviter toute ambiguite sur les droits ou l'affiliation a une marque.
