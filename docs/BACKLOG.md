# ReviewFlow - Backlog du MVP

Version : 1.0  
Charge cible : 12 a 16 heures  
Regle : aucun bonus avant validation de tout le MVP.

## Definition of Done

Une tache est terminee lorsque :

- le comportement attendu fonctionne ;
- les erreurs previsibles sont gerees ;
- les tests pertinents passent ;
- le lint et le build restent valides ;
- la documentation affectee est mise a jour ;
- le commit decrit clairement le changement.

## P0 - Parcours indispensable

### RF-001 - Initialiser le monorepo

Estimation : 1 h

Statut : termine

- creer les espaces `extension` et `api` ;
- configurer TypeScript en mode strict ;
- ajouter les scripts communs `dev`, `build`, `test`, `lint` et `format` ;
- ajouter `.gitignore`, `.editorconfig` et `.env.example` ;
- rediger le README racine minimal ;
- verifier qu'aucun secret ou artefact genere n'est suivi.

Critere d'acceptation : les commandes de verification peuvent etre lancees depuis la racine.

### RF-002 - Creer une extension installable

Estimation : 1 h

Statut : termine

- creer un manifeste V3 ;
- declarer uniquement `activeTab`, `scripting` et `storage` ;
- afficher un popup de 360 px ;
- ajouter un etat vide et le bouton `Capturer cette page`.

Critere d'acceptation : Chrome et Edge chargent l'extension non empaquetee sans erreur.

### RF-003 - Capturer les donnees de base

Estimation : 1 h

Statut : termine

- lire le titre, l'URL, le domaine et la description ;
- recuperer le texte selectionne ;
- retourner un objet type et serialisable ;
- afficher les valeurs dans le popup.

Tests : repli vers le titre de la page et absence de selection.

### RF-004 - Extraire un produit JSON-LD

Estimation : 1 h 30

Statut : termine

- detecter les scripts `application/ld+json` ;
- gerer un objet, un tableau et `@graph` ;
- trouver une entree de type `Product` ;
- extraire nom, description, prix et devise ;
- conserver le repli vers les metadonnees.

Tests : JSON-LD valide, tableau, `@graph`, JSON invalide et prix absent.

### RF-005 - Editer une fiche

Estimation : 1 h 30

Statut : termine

- afficher le formulaire de la fiche ;
- rendre les donnees extraites modifiables ;
- gerer categorie, notes, avantages, inconvenients, criteres et tags ;
- afficher des validations comprehensibles.

Critere d'acceptation : une extraction imparfaite peut etre corrigee sans quitter le popup.

### RF-006 - Sauvegarder localement

Estimation : 1 h 30

Statut : termine

- definir `ReviewDraft` et la couche de stockage ;
- creer un identifiant et les dates ISO ;
- sauvegarder avec `chrome.storage.local` ;
- relire, modifier et supprimer avec confirmation ;
- documenter la limite locale retenue.

Tests : sauvegarde, relecture, mise a jour et suppression.

### RF-007 - Creer l'API et sa validation

Estimation : 1 h 30

Statut : termine

- creer l'application Express ;
- ajouter `GET /api/health` ;
- definir le schema Zod de la requete ;
- ajouter `POST /api/reviews/structure` ;
- normaliser les erreurs sans exposer de details sensibles.

Tests : health, requete valide, requete invalide et corps trop volumineux.

### RF-008 - Implementer le mode demo

Estimation : 1 h

Statut : termine

- generer un resume deterministe ;
- generer une checklist depuis les criteres fournis ;
- ne jamais convertir une donnee absente en fait ;
- renvoyer `mode: demo` et la date de generation.

Tests : resultat stable et absence d'invention.

### RF-009 - Connecter l'extension a l'API

Estimation : 1 h

Statut : termine

- appeler explicitement l'API au clic ;
- afficher chargement, succes et erreur ;
- sauvegarder le resultat genere ;
- afficher le mode de generation.

Critere d'acceptation : une panne API ne supprime ni ne corrompt le brouillon local.

### RF-010 - Exporter en JSON et Markdown

Estimation : 1 h

Statut : termine

- produire un JSON valide ;
- produire un Markdown lisible ;
- inclure source, date et mode ;
- telecharger les fichiers avec des noms surs.

Tests : caracteres speciaux, champs facultatifs et listes vides.

### RF-011 - Creer la page produit de demonstration

Estimation : 30 min

Statut : termine

- utiliser un produit et une marque fictifs ;
- inclure des metadonnees et un JSON-LD `Product` ;
- inclure un passage selectionnable ;
- documenter les valeurs attendues.

### RF-012 - Stabiliser le MVP

Estimation : 1 h

Statut : termine

- executer lint, tests et builds ;
- tester le parcours complet dans Chrome et Edge ;
- corriger les erreurs bloquantes ;
- verifier les permissions et l'absence de secrets.

## P1 - Livrables de candidature

### RF-013 - Finaliser le README

Estimation : 1 h

Statut : termine

- expliquer probleme, solution et limites ;
- ajouter le diagramme d'architecture ;
- documenter installation, utilisation, tests et choix techniques ;
- expliquer les modes demo et IA ;
- mentionner clairement l'assistance IA utilisee pendant le developpement.

### RF-014 - Produire les visuels et la demonstration

Estimation : 1 h

Statut : termine

- prendre les captures essentielles (`termine`) ;
- enregistrer une demonstration courte de 20 secondes (`termine`) ;
- montrer capture, correction, structuration et export ;
- verifier qu'aucune cle ou donnee privee n'apparait.

## P2 - Bonus bloques jusqu'a la fin du MVP

- RF-101 : connecter un fournisseur LLM reel ;
- RF-102 : deployer l'API (`termine`) ;
- RF-103 : dockeriser l'API (`termine`) ;
- RF-104 : ajouter un export CSV (`termine`) ;
- RF-105 : envoyer un webhook ;
- RF-106 : ajouter des tests end-to-end (`termine`) ;
- RF-107 : creer un tableau de bord Angular ;
- RF-108 : proposer une interface anglaise.

### RF-103 - Dockeriser l'API

Estimation : 1 h

Statut : termine

- construire l'API dans une image multi-stage reproductible ;
- ne conserver que les dependances de production dans l'image finale ;
- executer le processus Node.js avec un utilisateur non privilegie ;
- exposer le port configurable et verifier `/api/health` ;
- fournir une commande Docker Compose simple et documentee.

### RF-104 - Ajouter un export CSV

Estimation : 1 h

Statut : termine

- exporter une fiche sur une ligne avec des colonnes editoriales stables ;
- encoder le fichier en UTF-8 avec BOM pour les tableurs courants ;
- proteger les separateurs, guillemets et retours a la ligne dans les cellules ;
- ajouter le bouton au popup et le parcours end-to-end correspondant.

### RF-106 - Ajouter des tests end-to-end

Estimation : 2 h

Statut : termine

- automatiser le parcours principal dans un navigateur Chromium reel ;
- demarrer la page demo, le popup compile et l'API pendant le test ;
- verifier capture, validation, sauvegarde et structuration ;
- verifier les exports JSON et Markdown ;
- verifier la suppression avec confirmation ;
- conserver une trace et une capture seulement en cas d'echec.

## Plan par seances

Le plan s'adapte a la duree reellement disponible, sans supposer deux heures par jour.

| Seance | Objectif                  | Tickets        |
| ------ | ------------------------- | -------------- |
| 1      | Socle reproductible       | RF-001         |
| 2      | Extension installable     | RF-002         |
| 3      | Capture de base           | RF-003         |
| 4      | Extraction produit        | RF-004         |
| 5      | Formulaire editable       | RF-005         |
| 6      | Persistance locale        | RF-006         |
| 7      | API validee               | RF-007         |
| 8      | Structuration demo        | RF-008         |
| 9      | Integration extension/API | RF-009         |
| 10     | Exports et page demo      | RF-010, RF-011 |
| 11     | Stabilisation             | RF-012         |
| 12     | README                    | RF-013         |
| 13     | Visuels et video          | RF-014         |

## Seance 1 - objectif d'une heure

Resultat attendu : le depot dispose d'un socle propre, mais aucune fonctionnalite metier n'est commencee.

Ordre de travail :

1. verifier les versions locales de Node.js et npm ;
2. initialiser les workspaces npm ;
3. configurer TypeScript strict ;
4. ajouter les scripts de qualite ;
5. executer les premieres verifications ;
6. creer le premier commit si le depot GitHub est pret.

Si une dependance bloque la seance, la priorite est d'obtenir un socle reproductible minimal, pas de commencer RF-002.
