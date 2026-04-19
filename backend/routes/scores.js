const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const authMiddleware = require('../middleware/auth');

const normalizeGame = (rawGame) => {
  if (typeof rawGame !== 'string') return null;

  const value = rawGame.trim().toLowerCase();
  if (value === 'dom') return 'dom';
  if (value === 'canvas') return 'canvas';
  if (value === 'babylone' || value === 'babylon' || value === 'babylonjs') return 'babylone';

  return null;
};

const resolveGameFromReferer = (referer) => {
  if (typeof referer !== 'string' || !referer.trim()) return null;

  try {
    const pathname = new URL(referer).pathname.toLowerCase();
    if (pathname.includes('/dom/')) return 'dom';
    if (pathname.includes('/canvas/')) return 'canvas';
    if (pathname.includes('/babylonjs/')) return 'babylone';
  } catch (error) {
    return null;
  }

  return null;
};

// Submit a new score
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score, game } = req.body;

    if (score === undefined || score === null || Number.isNaN(Number(score))) {
      return res.status(400).json({ message: 'Score invalide' });
    }

    const normalizedGame =
      normalizeGame(game) ||
      resolveGameFromReferer(req.headers.referer || req.headers.referrer || '');

    if (!normalizedGame) {
      return res.status(400).json({
        message: 'Jeu invalide. Valeurs acceptees: dom, canvas, babylone.'
      });
    }

    const newScore = new Score({
      username: req.user.username,
      score: Number(score),
      game: normalizedGame
    });

    await newScore.save();
    res.status(201).json({ message: 'Score enregistré avec succès', score: newScore });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get top scores (e.g., top 10, sorted by score in descending order)
router.get('/', async (req, res) => {
  try {
    const { game } = req.query;
    const validGames = ['dom', 'canvas', 'babylone'];
    const query = validGames.includes(game) ? { game } : {};
    const topScores = await Score.find(query).sort({ score: -1, timestamp: 1 }).limit(10);
    res.json(topScores);
  } catch (error) {
    console.error('Error fetching top scores:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;