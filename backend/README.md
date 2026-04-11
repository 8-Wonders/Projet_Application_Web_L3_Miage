# Backend - Games on Web

Backend Node.js pour la gestion des utilisateurs, de l'authentification JWT/OAuth2 Google et des scores.

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
- `db.js` - Connexion à MongoDB
- `routes/auth.js` - Routes d'authentification JWT
- `routes/scores.js` - Scores protégés par JWT
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

### 4. Connexion OAuth2 Google
**POST** `/api/auth/oauth/google`

Body:
```json
{
  "idToken": "<google-id-token>"
}
```

### 4.b Config Google OAuth publique
**GET** `/api/auth/oauth/google/config`

Response:
```json
{
  "configured": true,
  "clientId": "<google-client-id>"
}
```

Cette route permet au frontend de récupérer automatiquement le `GOOGLE_CLIENT_ID`.

Response:
```json
{
  "message": "Connexion Google réussie",
  "user": {
    "id": "1234567890",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Envoyer un score
**POST** `/api/scores`

Headers:
```
Authorization: Bearer <token>
```

Body:
```json
{
  "score": 42
}
```

Le nom d'utilisateur est récupéré côté serveur à partir du token JWT.

### 6. Vérifier la santé du serveur
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
- Les `idToken` Google sont vérifiés côté serveur avant émission du JWT applicatif
- CORS activé pour les requêtes cross-origin
- Les mots de passe ne sont jamais retournés par l'API
- Les scores sont acceptés uniquement avec un token JWT valide

## Variables d'environnement (.env)

- `PORT` - Port du serveur (défaut: 3000)
- `JWT_SECRET` - Clé secrète pour signer les tokens
- `NODE_ENV` - Environnement (development/production)
- `GOOGLE_CLIENT_ID` - Client ID OAuth2 Google (obligatoire pour `/api/auth/oauth/google`)
- `MONGODB_URI` - Chaîne de connexion MongoDB

## Notes

- Les utilisateurs et scores sont stockés dans MongoDB
- Les comptes OAuth2 sont liés automatiquement par email si un compte existe déjà
