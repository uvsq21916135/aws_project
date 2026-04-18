# Dames en Ligne (Multi-Utilisateur)

## Présentation du Projet
Ce projet est une plateforme de **Jeu de Dames (plateau 10x10)** en ligne et en temps réel. Il permet aux utilisateurs de créer un compte, de se rejoindre dans un salon d'attente (Lobby) et de s'affronter en direct. L'interface offre un design moderne et fluide.

## Lien vers le site
https://dames-en-ligne.onrender.com/

## Fonctionnalités Principales
- **Multijoueur Temps Réel** : Les actions sont échangées dans la fraction de seconde grâce au réseau `WebSockets` full-duplex.
- **Matchmaking (Lobby Dynamique)** : Voyez uniquement les adversaires "Actuellement en Ligne" et envoyez-leur un défi en 1 clic.
- **Gestion des Règles du Jeu** : Validation des coups, sauts obligatoires consécutifs, et promotion dynamique en *Dame* lorsqu'un pion atteint l'autre bout de l'arène.
- **Sauvegarde des Scores** : Vos ratios de victoires/défaites sont mémorisés de façon persistante.

## Stack Technique
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla ES6+)
- **Backend API & WebSockets** : Node.js, Express.js, module `ws`
- **Hébergement** : Render.com
- **Base de Données** : MongoDB (Atlas cloud) & ODM Mongoose
- **Sécurité et Hachage** : `jsonwebtoken`, `argon2`, `express-rate-limit`, SSL embarqué natif.

## Engagements Sécurité & Anti-Triche
Le code Backend agit comme une forteresse pour empêcher toute usurpation ou triche de l'interpréteur de code source public du navigateur.
- **Serveur Autoritaire (Anti-Cheat)** : La vérification mathématique et géométrique de chaque mouvement (`isValidMove`, victoire/défaite) s'opère dans la RAM du serveur Node.js par simulation. Le frontend du joueur ne contrôle que l'affichage visuel absolu, rendant la triche inenvisageable.
- **Usurpation d'Identité WebSockets (Bloquée)** : Signature stricte d'habilitation en transmettant des **Jetons JWT** au serveur WS. (Empêche qu'un pirate usurpe une partie d'autrui).
- **NoSQL Injection / Memory Denial** : Contrôle du formatage JSON des charges utiles sortantes (`typeof`, filtres des strings), interdisant à Mongoose d'interpréter des entités malicieuses.
- **Cryptographie des Mots de Passe** : Hachage intensif par l'algorithme asymétrique lourd **Argon2**.
- **Déni de Service (DDoS)** : L'implémentation algorithmique d'un Rate Limiter protège explicitement de la saturation CPU sur de fausses entrées d'API par *Brute Force*.
- **Proxy Translation** : `Trust Proxy` activé afin de lire la réelle identité IP distribuée derrière un Load Balancer (ELB) applicatif AWS ou un Reverse-Proxy de classe mondiale.

## Installation et Lancement local

```bash
# 1. Cloner le répertoire
git clone https://github.com/uvsq21916135/aws_project

# 2. Installer les modules dépendants NPM
npm install

# 3. Sécuriser les variables d'environnement
# Créer à la racine finale un fichier vide `.env` contenant :
MONGO_URI=votre_lien_vers_votre_cluster_mongodb
JWT_SECRET=votre_phrase_secrete_ultra_robuste

# 4. Autorité de certification (Chiffrement SSL Actif)
# Vous devez générer vos propres clés de sécurité au format racine pour débloquer le réseau "HTTPS" et "WSS":
openssl req -nodes -new -x509 -keyout key.pem -out cert.pem

# 5. Démarrage de l'instance
npm start # (Lance index.js ou server.js selon package.json)
```
Une fois le composant allumé : Connectez de multiples joueurs et naviguez sur [`https://localhost:3000`](https://localhost:3000) (Ignorer l'alerte d'auto-signature du navigateur sur un socle de dev-local).
