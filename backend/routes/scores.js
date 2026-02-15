const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

// Submit a new score
router.post('/', async (req, res) => {
  try {
    const { username, score, timestamp } = req.body;

    if (!username || !score || !timestamp) {
      return res.status(400).json({ message: 'Username, score, and timestamp are required' });
    }

    const newScore = new Score({
      username,
      score,
      timestamp: new Date(timestamp) // Ensure timestamp is a Date object
    });

    await newScore.save();
    res.status(201).json({ message: 'Score submitted successfully', score: newScore });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top scores (e.g., top 10, sorted by score in descending order)
router.get('/', async (req, res) => {
  try {
    const topScores = await Score.find().sort({ score: -1, timestamp: 1 }).limit(10);
    res.json(topScores);
  } catch (error) {
    console.error('Error fetching top scores:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;