require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const scoresRouter = require('./routes/scores');

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

// Gestion des erreurs 404 pour API
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});