# Backend - Games on Web

Backend Node.js pour la gestion des utilisateurs et de l'authentification.

## Installation

```bash
npm install
```

## Démarrage

### Mode développement (avec auto-reload):
```bash
npm run dev
```

### Mode production:
```bash
npm start
```

Le serveur démarre par défaut sur `http://localhost:3000`

## Structure

- `server.js` - Point d'entrée principal
- `userDatabase.js` - Gestion de la base de données JSON
- `routes/auth.js` - Routes d'authentification
- `data/users.json` - Fichier de stockage des utilisateurs (créé automatiquement)
- `.env` - Variables d'environnement

## API Endpoints

### 1. Inscription
**POST** `/api/auth/register`

Body:
```json
{
  "username": "john_doe",
  "password": "password123",
  "email": "john@example.com"
}
```

Response:
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": "1234567890",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Connexion
**POST** `/api/auth/login`

Body:
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": "1234567890",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Récupérer le profil
**GET** `/api/auth/profile`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "user": {
    "id": "1234567890",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2026-02-10T10:30:00.000Z"
  }
}
```

### 4. Vérifier la santé du serveur
**GET** `/api/health`

Response:
```json
{
  "message": "Serveur fonctionnel"
}
```

## Sécurité

- Les mots de passe sont hashés avec **bcryptjs**
- Les tokens sont générés avec **JWT** (24h d'expiration)
- CORS activé pour les requêtes cross-origin
- Les mots de passe ne sont jamais retournés par l'API

## Variables d'environnement (.env)

- `PORT` - Port du serveur (défaut: 3000)
- `JWT_SECRET` - Clé secrète pour signer les tokens
- `NODE_ENV` - Environnement (development/production)

## Notes

- Les utilisateurs sont stockés dans `data/users.json`
- Les données persister même après redémarrage du serveur
- Pas de base de données externe requise pour démarrer
