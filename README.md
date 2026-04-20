<h1 align="center">UE Application Web - L3 MIAGE</h1>

<div align="center">
<img src="https://img.shields.io/badge/status-development-blue" />
</div>

Ce dépôt contient le rendu de projet pour l'UE Application Web (Licence 3 MIAGE) à l'Université Côte d'Azur. L'objectif était de concevoir et développer une plateforme qui hébèrge une suite de trois jeux web distincts utilisant chacun une technologie de rendu différente (Canvas, DOM, et BabylonJS), le tout unifié par une architecture backend commune gérant les scores et l'authentification.

L'équipe :

- BOUTRIK Alexandre
- MANILIUC David
- LANDOULSI Aziz

## Déploiement et Lien du Jeu

> [!IMPORTANT]
> Le projet est entièrement hébergé et jouable en ligne. Vous pouvez y accéder, naviguer dans le menu principal, créer un compte et tester les trois jeux directement via le lien suivant : [https://projet-application-web-l3-miage.onrender.com/](https://projet-application-web-l3-miage.onrender.com/).

## Justification des Choix

* **Le jeu DOM (Clicker-like)** : Nous voulions un jeu simple, très addictif et basé sur les mécaniques de Cookie Clicker, mais avec un thème original lié à notre formation : le développement. Le principe est de générer du code (1 clic = 1 SLOC - Source Line Of Code). Les améliorations (upgrades) pour automatiser la production incluent l'embauche de développeurs offshore, l'utilisation de modèles d'IA, etc. La manipulation du DOM se prête parfaitement à ce genre de jeu.

* **Le jeu Canvas (Worms-like)** : Pour le Canvas en 2D, nous voulions recréer un jeu d'artillerie au tour par tour. Cela nous a permis de travailler sur la physique, la balistique, les collisions et la destruction de terrain, des éléments très adaptés au dessin par pixels sur un Canvas.

* **Le jeu BabylonJS (Auto-Chess)** : Nous avons choisi d'utiliser la 3D pour créer un jeu hybride ambitieux mélangeant les mécaniques de Teamfight Tactics (TFT) et des Échecs. C'est un auto-chess avec des pièces personnalisées, le tout propulsé par WebAssembly. C'était l'occasion pour nous de relever un vrai défi technique en mariant la 3D à un moteur externe extrêmement performant.

### Démos en vidéo

* **Jeu DOM (Dev Clicker)** : [Voir la démo sur YouTube](https://youtu.be/3Z7BMFcVLAM).
* **Jeu Canvas (Worms-like)** : [Voir la démo sur YouTube](https://youtu.be/aV_uZ5Rx_kc).
* **Jeu BabylonJS (Auto-Chess)** : [Voir la démo sur YouTube](https://youtu.be/J3baV50jk4l).

## Difficultés Rencontrées

La partie la plus complexe et la plus difficile du projet a été, de loin, le jeu BabylonJS.

La difficulté ne venait pas tant de la 3D en elle-même, mais de la compilation, de la configuration et du débogage du moteur Stockfish en WebAssembly pour le plier à nos mécaniques d'auto-chess. Faire fonctionner une logique de TFT en utilisant un moteur d'échecs qui doit supporter une grande variété de pièces non-standard et de règles personnalisées a été un véritable casse-tête.

L'interfaçage entre ce moteur compilé et le code JavaScript de BabylonJS a causé de nombreux problèmes de synchronisation et d'états. À l'heure actuelle, ce problème n'est pas encore totalement résolu : le jeu est fonctionnel de manière instable (environ 1 partie sur 2 fonctionne correctement avant de rencontrer une erreur d'état du moteur).

## Répartition du Travail

Le projet a été développé en collaboration, avec la répartition des tâches et de la charge de travail suivante :

| Membre | Responsabilités Principales | Détail des Contributions |
| --- | --- | --- |
| Aziz Landoulsi | Backend & Déploiement | 100% sur le développement du Menu principal et de l'interface de navigation.<br><br>100% sur la conception du Backend (API REST, gestion des utilisateurs et des scores).<br><br>100% sur le déploiement de l'application (Render). |
| Alexandre Boutrik | DOM & Canvas | 100% sur la réalisation du jeu DOM (Dev Clicker).<br><br>70% sur le développement du jeu Canvas (Worms-like).<br><br>30% d'assistance sur le jeu BabylonJS. |
| David Maniliuc | BabylonJS & Canvas | 70% sur la conception et l'intégration du jeu 3D BabylonJS (Auto-Chess).<br><br>30% de contribution sur le jeu Canvas (Worms-like).<br><br>_Note : David a également réalisé un jeu DOM annexe (50%) en dehors de ce groupe._ |

## Architecture du Projet

> [!NOTE]
> Chaque jeu possède son propre contexte et interagit avec le backend/ de manière indépendante pour l'envoi et la récupération des scores à la fin d'une partie.

Le dépôt est organisé de manière modulaire, séparant de façon stricte la logique serveur de l'interface utilisateur et des différents moteurs de jeu. Voici un aperçu détaillé de l'arborescence :

```
.
├── backend/                # Serveur Node.js et API
├── frontend/
│   ├── babylonjs/          # Jeu 3D Auto-Chess
│   ├── canvas/             # Jeu 2D Worms-like
│   ├── common/             # Outils partagés
│   ├── dom/                # Jeu Dev Clicker
│   └── menu/               # Hub de navigation
└── README.md               # Ce fichier
```

* **Le Backend (`backend/`)** : Il contient le serveur Node.js, les middlewares de sécurité (`middleware/auth.js`) et les modèles de base de données tels que `Score.js` et `User.js`. Il expose également les différentes routes de l'API REST (`routes/auth.js`, `routes/scores.js`, `routes/users.js`) pour la communication avec le frontend.

* **Le jeu BabylonJS (`frontend/babylonjs/`)** : Ce répertoire regroupe toute la logique de l'Auto-Chess 3D. Les modèles 3D personnalisés des pièces (fichiers `.stl` et `.glb`) sont stockés dans le dossier `public/assets/`. Le cœur intellectuel du jeu, incluant le moteur Stockfish compilé en WebAssembly, se trouve dans le sous-dossier `engine/`, tandis que la logique applicative (services, rendu, état du jeu) est architecturée dans `src/`.

* **Le jeu Canvas (`frontend/canvas/`)** : Il contient le code du jeu d'artillerie. Les cartes du jeu au format CSV et les sprites sont stockés dans `assets/`. Le dossier `js/` sépare proprement la logique de l'IA, des projectiles, des joueurs et des compétences.

* **Le jeu DOM (`frontend/dom/`)** : Dédié au Dev Clicker, il utilise les ressources graphiques de `assets/` et centralise ses mécaniques (scores, améliorations, état) dans les scripts JavaScript du dossier `js/`.

* **Le Menu (`frontend/menu/`)** : Il fait office de portail principal avec ses vues HTML (accueil, classement, sélection des jeux). Son dossier `js/` contient les scripts gérant l'authentification et les appels vers l'API du backend.

* **Les Outils Communs (`frontend/common/`)** : Ce dossier abrite des scripts transversaux utilisés par plusieurs jeux, notamment un chargeur d'assets et un parseur de fichiers CSV (`csv-parser.js`).

## Documentation

Each game is located in its respective directory within `frontend/` and includes its own dedicated `README.md` and detailed `documentation/` subfolder (architecture diagrams, design patterns, etc).

## LICENSE

Ce projet est sous licence [MIT](https://opensource.org/licenses/MIT). N'hésitez pas à utiliser, modifier ou distribuer le code.

---

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the code as needed. See the [LICENSE](LICENSE) file for more information.
