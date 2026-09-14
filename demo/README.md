# Page produit de demonstration

Cette page fournit un scenario stable pour tester ReviewFlow sans dependre d'un site marchand
externe. Le produit et la marque sont fictifs.

## Lancer la page

Depuis la racine du projet, dans un terminal CMD :

```cmd
npm run demo
```

Ouvrir ensuite <http://localhost:4173>, selectionner le passage bleu, puis cliquer sur l'extension
ReviewFlow et sur `Capturer cette page`.

Si le port `4173` est deja utilise, verifier d'abord si la page est deja ouverte a cette adresse.
Sinon, identifier le processus depuis CMD avec `netstat -ano | findstr :4173`, verifier son PID avec
`tasklist /FI "PID eq <PID>"`, puis arreter uniquement ce processus avec `taskkill /PID <PID> /F`.

## Valeurs attendues

| Champ                  | Valeur attendue                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Titre de page          | `AeroClean Nova X1 \| Atelier Nova`                                                                                  |
| Domaine                | `localhost`                                                                                                          |
| Nom du produit         | `AeroClean Nova X1`                                                                                                  |
| Description du produit | `Aspirateur-balai fictif avec trois niveaux de puissance et une autonomie annoncee de 45 minutes.`                   |
| Prix                   | `149.9`                                                                                                              |
| Devise                 | `EUR`                                                                                                                |
| Texte selectionne      | Le passage commencant par `Passage a selectionner` (les accents restent conserves dans le popup et dans les exports) |

Le nom, la description, le prix et la devise viennent du JSON-LD `Product`. Les metadonnees HTML
restent presentes pour verifier les valeurs de repli si le JSON-LD est retire ou invalide.
