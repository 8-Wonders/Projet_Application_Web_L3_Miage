require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const scoresRouter = require('./routes/scores');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins for development/game frontend
  credentials: true
}));

// Routes API
app.use('/api/scores', scoresRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Endpoint API racine pour vérifier rapidement que le backend répond
app.get('/api', (req, res) => {
  res.json({ message: 'Backend actif', endpoints: ['/api/scores', '/api/health'] });
});

// Endpoint de santé simple
app.get('/api/health', (req, res) => {
  res.json({ message: 'Serveur fonctionnel' });
});

// Servir le frontend "menu" sur le port backend
const menuPath = path.join(__dirname, '..', 'frontend', 'menu');
const domPath = path.join(__dirname, '..', 'frontend', 'dom');
const canvasPath = path.join(__dirname, '..', 'frontend', 'canvas');
const babylonPath = path.join(__dirname, '..', 'frontend', 'babylonjs');
const babylonDistPath = path.join(babylonPath, 'dist');
const babylonDistAssetsPath = path.join(babylonDistPath, 'assets');
const babylonDistEnginePath = path.join(babylonDistPath, 'engine');
app.use('/assets', express.static(babylonDistAssetsPath));
app.use('/engine', express.static(babylonDistEnginePath));
app.use(express.static(menuPath));
app.use('/dom', express.static(domPath));
app.use('/canvas', express.static(canvasPath));
app.use('/babylonjs', express.static(babylonPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route racine: affiche le menu
app.get('/', (req, res) => {
  res.sendFile(path.join(menuPath, 'index.html'));
});

// Gestion des erreurs 404 pour API uniquement
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
