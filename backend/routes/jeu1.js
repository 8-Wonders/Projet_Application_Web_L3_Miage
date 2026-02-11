const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');

// Sauvegarder le score d'un jeu
router.post('/score', verifyToken, (req, res) => {
  try {
    const { score, level } = req.body;
    const userId = req.user.id;

    if (score === undefined) {
      return res.status(400).json({ message: 'Score requis' });
    }

    // TODO: Sauvegarder le score dans la BDD
    // Pour l'instant, on retourne juste un message de succès

    res.json({
      message: 'Score sauvegardé',
      userId,
      score,
      level
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du score:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer le meilleur score
router.get('/score', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Récupérer le meilleur score de la BDD

    res.json({
      message: 'Score récupéré',
      userId,
      score: 0,
      level: 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du score:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
