require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { router: authRouter } = require('./routes/auth');
const { router: usersRouter } = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: '*', // À adapter selon vos besoins de sécurité
  credentials: true
}));

// Routes API
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Servir les uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend/menu')));

// Servir index.html pour les routes non-API (Single Page App)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/menu/index.html'));
});

// Gestion des erreurs 404 pour API
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
